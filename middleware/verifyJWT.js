const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'Please authenticate.' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Please authenticate.' });
      req.user = decoded.UserInfo.username;
      req.roles = decoded.UserInfo.roles;

      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

module.exports = verifyJWT;
