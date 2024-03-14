require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const PORT = process.env.PORT || 3500;
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');

// Connect to mongoDB
connectDB();

// Custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS !
// And fetch cookies credentials requirement.
app.use(require('./middleware/credentials'));

// CORS
app.use(cors(require('./config/corsOptions')));

// built-in middleware for form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// Middleware for cookies
app.use(cookieParser());

// built-in middleware to serve static files
app.use(express.static(path.join(__dirname, '/public')));

app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/auth'));
app.use('/register', require('./routes/register'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT);
app.use('/employees', require('./routes/api/employees'));

app.all('*', (req, res) => {
  res.status(404);

  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

app.use(errorHandler);

// Only listen for the request when we have a MongoDB connection.
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
