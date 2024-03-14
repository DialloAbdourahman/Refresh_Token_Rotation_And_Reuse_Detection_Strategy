const express = require('express');
const router = express.Router();
const registerConstroller = require('../controllers/registerController');

router.post('/', registerConstroller.handleNewUser);

module.exports = router;
