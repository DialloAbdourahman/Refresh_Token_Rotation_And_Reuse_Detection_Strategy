const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const User = require('../model/User');

const handleNewUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  const duplicate = await User.findOne({ username }).exec();

  if (duplicate) {
    res.status(409);
    throw new Error('Username exist already');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.create({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ success: `New user ${result.username} created.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = { handleNewUser };
