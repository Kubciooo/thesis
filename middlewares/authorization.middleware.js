const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const variables = require("../constants/variables");

const AuthorizationMiddleware = (() => {
  const authorize = tryCatch(async (req, res, next) => {
    console.log(req.headers.authorization);
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
    const decoded = jwt.verify(token, variables.jwtSecret.password[process.env.NODE_ENV]);
    console.log(decoded);
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
