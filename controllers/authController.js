const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../model/User');

const handleLogin = asyncHandler(async (req, res) => {
  // Check if the is an existing cookie.
  const cookies = req.cookies;
  // console.log(`cookie available at login ${JSON.stringify(cookies)}`);

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required.');
  }

  const foundUser = await User.findOne({ username }).exec();
  if (!foundUser) {
    res.status(401);
    throw new Error('Unable to login');
  }

  const match = await bcrypt.compare(password, foundUser.password);
  if (!match) {
    res.status(401);
    throw new Error('Unable to login');
  }

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

  // Check to see if the incoming cookies has a refresh token so that we can delete it and also delete it from the db. This makes sure that one device doesn't have many refresh tokens at a time but we can still support multiple device login.
  let newRefreshTokenArray = !cookies?.jwt
    ? foundUser.refreshToken
    : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /*                                                                                                        //
    Scenario added here:                                                                                    //
      1) User logs in but never users RT and doesn't log out.                                               //
      2) RT is stolen.                                                                                      //
      3) If 1 & 2, reuse-detection is needed to clear all RTs when user logs in.                            //
  */ //
  if (cookies?.jwt) {
    const refreshToken = cookies.jwt;
    const foundToken = await User.findOne({ refreshToken }).exec();

    // Detected refresh token reuse!
    if (!foundToken) {
      console.log('attempted refresh token reuse at login!');
      newRefreshTokenArray = [];
    }

    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Saving refreshToken with current user
  foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  await foundUser.save();

  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.ENVIRONMENT === 'development' ? false : true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ accessToken });
});

module.exports = { handleLogin };
