const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

module.exports = (err, res) => {
  console.log("error hanf");
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "ERROR";

  if (process.env.NODE_ENV == "PROD") {
    //If any global error handling we want to do we can
    // call a method and set error msg and return new AppError object, then that ll be sent to sendErrorProd
    sendErrorProd(err, res);
  } else if (process.env.NODE_ENV == "DEV") {
    sendErrorDev(err, res);
  }
};
