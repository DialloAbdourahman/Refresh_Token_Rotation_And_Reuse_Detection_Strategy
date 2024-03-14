const { logEvents } = require('./logEvents');

const errorHandler = (err, req, res, next) => {
  logEvents(`${err.name}:${err.message}`, 'errLog.txt');

  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  // console.log(err);

  res.json({
    message: err.message,
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
