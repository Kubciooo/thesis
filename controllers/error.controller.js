const AppError = require("../services/error.service");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");

const ErrorController = (() => {
  const handleDuplicates = (err) => {
    const fieldName = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `The value in ${fieldName} already exists in DB - please use other value`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = "Unique Duplicates Error";
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = "Cast Error";
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = "Validation Error";
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  const handleJWTInvalidError = () => {
    const message = `Invalid JWT token`;
    const statusCode = HTTP_STATUS_CODES.INVALID;
    const name = "JsonWebToken Error";
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  const handleJWTExpiredError = () => {
    const message = `Expired JWT token`;
    const statusCode = HTTP_STATUS_CODES.INVALID;
    const name = "Token Expired Error";
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  const handleOtherError = (err) => {
    console.log(err);
    const message = err.message;
    const statusCode = err.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER;
    const name = err.name;
    const isOperational = false;
    return new AppError(name, statusCode, message, isOperational);
  };

  const sendErrorToClient = (err, res) => {
    const { message, statusCode, name } = err;
    res.status(statusCode).json({
      status: "Failed",
      name,
      message,
    });
  };

  const findError = (err) => {
    if (err.code === 11000) return handleDuplicates(err);
    switch (err.name) {
      case "CastError":
        return handleCastError(err);
      case "ValidationError":
        return handleValidationError(err);
      case "JsonWebTokenError":
        return handleJWTInvalidError();
      case "TokenExpiredError":
        return handleJWTExpiredError();
      default:
        return handleOtherError(err);
    }
  };

  const initialize = (err, req, res, next) => {
    err.statusCode = err.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER;

    const errorData = findError(err);
    sendErrorToClient(errorData, res);
  };

  return { initialize };
})();

module.exports = ErrorController;
