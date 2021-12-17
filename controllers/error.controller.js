const AppError = require('../services/error.service');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');

/**
 * Kontroler błędów - zarządzanie błędami
 */
const ErrorController = (() => {
  /**
   * Błąd z duplikatami w bazie danych
   * @param {*} err - błąd
   * @returns
   */
  const handleDuplicates = (err) => {
    const fieldValue = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `The value ${fieldValue} already exists in DB - please use other value`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = 'Unique Duplicates Error';
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Błąd z nieprawidłowym formatem danych
   * @param {*} err - błąd
   * @returns
   */
  const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = 'Cast Error';
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Błąd dotyczący walidacji danych
   * @param {*} err - błąd
   * @returns
   */
  const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    const statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
    const name = 'Validation Error';
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Błąd dotyczący JWT
   * @returns {AppError} - błąd
   */
  const handleJWTInvalidError = () => {
    const message = `Invalid JWT token`;
    const statusCode = HTTP_STATUS_CODES.INVALID;
    const name = 'JsonWebToken Error';
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Błąd dotyczący wygasłego tokena
   * @returns {AppError} - błąd
   */
  const handleJWTExpiredError = () => {
    const message = `Expired JWT token`;
    const statusCode = HTTP_STATUS_CODES.INVALID;
    const name = 'Token Expired Error';
    const isOperational = true;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Inne błędy
   * @param {*} err - błąd
   * @returns
   */
  const handleOtherError = (err) => {
    const { message } = err;
    const statusCode = err.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER;
    const { name } = err;
    const isOperational = false;
    return new AppError(name, statusCode, message, isOperational);
  };

  /**
   * Wyświetla błąd
   * @param {*} err
   * @param {*} res
   */
  const sendErrorToClient = (err, res) => {
    const { message, statusCode, name } = err;
    res.status(statusCode).json({
      status: HTTP_STATUS_MESSAGES.ERROR,
      name,
      message,
    });
  };

  /**
   * Obsługa błędów 
   * @param {*} err 
   * @returns 
   */
  const findError = (err) => {
    if (err.code === 11000) return handleDuplicates(err);
    switch (err.name) {
      case 'CastError':
        return handleCastError(err);
      case 'ValidationError':
        return handleValidationError(err);
      case 'JsonWebTokenError':
        return handleJWTInvalidError();
      case 'TokenExpiredError':
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
