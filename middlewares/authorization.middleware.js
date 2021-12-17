const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const variables = require('../constants/variables');

/**
 * Middleware autoryzacji użytkownika - sprawdza czy użytkownik jest zalogowany i czy ma dostęp do danego endpointu (zwraca 401 jeśli nie)
 */
const AuthorizationMiddleware = (() => {
  /**
   * Funkcja sprawdzająca czy użytkownik jest zalogowany i czy ma dostęp do danego endpointu
   */
  const authorize = tryCatch(async (req, res, next) => {
    let token;
    /**
     * Sprawdzenie czy token jest w nagłówku
     */
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(
        new AppError(
          'InvalidUser',
          HTTP_STATUS_CODES.INVALID,
          'Please log in to get access to this route'
        )
      );
    }
    /**
     * Sprawdzenie czy token jest ważny
     */
    const decoded = jwt.verify(
      token,
      variables.jwtSecret.password[process.env.NODE_ENV]
    );
    /**
     * Sprawdzenie czy użytkownik istnieje
     */
    const user = await User.findById(decoded.id);

    /* istanbul ignore if */
    if (!user) {
      return next(
        new AppError(
          'InvalidUser',
          HTTP_STATUS_CODES.INVALID,
          "This user doesn't exist."
        )
      );
    }

    /**
     * Sprawdzenie czy użytkownik jest zalogowany i czy hasło nie zostało zmienione w ciągu czasu (zmiana hasła wymaga nowego tokena)
     */
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'PasswordChangedError',
          'User recently changed password! Please log in again.',
          HTTP_STATUS_CODES.INVALID
        )
      );
    }

    req.user = user;
    return next();
  });

  return { authorize };
})();

module.exports = AuthorizationMiddleware;
