const User = require("../models/user.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const HTTP_STATUS_MESSAGES = require("../constants/httpStatusMessages");

const UserController = (() => {
  const signup = tryCatch(async (req, res, next) => {
    const { login, email, password, retypePassword } = req.body;

    if (password !== retypePassword) {
      next(
        new AppError(
          "PasswordsAreSameError",
          HTTP_STATUS_CODES.FORBIDDEN,
          "Passwords are not the same",
          true
        )
      );
    }

    const user = User({ login, email }).setPassword(password);
    user.shops = [];
    user.products = [];
    const newUser = await user.save();

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        user: newUser,
      },
    });
  });

  return { signup };
})();

module.exports = UserController;
