const User = require('../model/User');

const handleLogout = async (req, res) => {
  // On client also delete the access token.

  // Get the cookie.
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);

  // Get the refresh token
  const refreshToken = cookies.jwt;

  // Check if refresh token is found in db.
  const foundUser = await User.findOne({ refreshToken }).exec();

  // Clear the cookie if the user is not found in db.
  if (!foundUser) {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.ENVIRONMENT === 'development' ? false : true,
    });
    return res.sendStatus(204);
  }

  // Delete refresh token in db.
  foundUser.refreshToken = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );
  await foundUser.save();

  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });

  res.sendStatus(204);
};

module.exports = { handleLogout };
