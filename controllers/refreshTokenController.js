const jwt = require('jsonwebtoken');
const User = require('../model/User');

const handleRefreshToken = async (req, res) => {
  // Get the cookies from the request
  const cookies = req.cookies;

  // Send Unauthorized if the jwt cookie wasn't found.
  if (!cookies?.jwt) return res.sendStatus(401);

  // Delete the cookie immediately from the user's browser since we want a refresh token to be used only once.
  const refreshToken = cookies.jwt;
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.ENVIRONMENT === 'development' ? false : true,
  });

  // Try to find the user with the refresh token.
  const foundUser = await User.findOne({ refreshToken }).exec();

  // If we didn't find a user but we got a refresh token, it means that the refresh token doesn't exist anymore in the db and has been used already and deleted. This here is a reuse detection situation. We then want to decode the token and see if we can get a username so that we can invalidate all the active refresh tokens of the user.
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        // If there is an error decoding the token, then it means the token has already expired and isn't valid anymore so no worries
        if (err) return res.sendStatus(403);

        // Now if we can decode the token, it means someone is trying to reuse this valid refresh token to perform bad activities and so we need to invalidate all the refresh token.
        console.log('Attempting refresh token reuse at refresh token!');
        const hackedUser = await User.findOne({ username: decoded.username });
        hackedUser.refreshToken = [];
        await hackedUser.save();
      }
    );
    return res.sendStatus(403);
  }

  // At this point, we found the user and his refreshToken (but we don't yet know if the refresh token is still valid) and as such we need to remove this refresh token from the refresh token array found in the db.
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      // we received a valid token and verified the user but unfortunately the token has expired. We need to update our data in DB.
      if (err) {
        console.log('Expired refresh token');
        foundUser.refreshToken = [...newRefreshTokenArray];
        foundUser.save();
      }

      // And here the 403 is still sent.
      if (err || foundUser.username !== decoded.username)
        return res.sendStatus(403);

      // Refresh token was still valid. So we create a new access and refresh token.
      const roles = Object.values(foundUser.roles);
      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30s' }
      );
      const newRefreshToken = jwt.sign(
        {
          username: foundUser.username,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
      );

      // Saving refreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      await foundUser.save();

      // We also want to send a new cookie back
      res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        sameSite: 'none',
        secure: process.env.ENVIRONMENT === 'development' ? false : true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    }
  );
};

module.exports = { handleRefreshToken };
