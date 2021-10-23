const { promisify } = require('util');
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");

const AuthorizationMiddleware = (() => {
  const authorize = tryCatch(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(
        new AppError(
          "InvalidUser",
          HTTP_STATUS_CODES.INVALID,
          "Please log in to get access to this route"
        )
      );
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new AppError(
          "InvalidUser",
          HTTP_STATUS_CODES.INVALID,
          "This user doesn't exist."
        )
      );
    }

    req.user = user;
    return next();
  });

  return { authorize };
})();

module.exports = AuthorizationMiddleware;
