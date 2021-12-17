/**
 * Klasa do niestandardowej obsługi błędów
 */
class AppError extends Error {
  constructor(name, statusCode, message, isOperational = true) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this);
  }
}

module.exports = AppError;
