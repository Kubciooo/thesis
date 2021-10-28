const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const HTTP_STATUS_MESSAGES = require("../constants/httpStatusMessages");
const variables = require("../constants/variables");

const UserController = (() => {
  const signup = tryCatch(async (req, res, next) => {
    if (req.body.password !== req.body.retypePassword) {
      return next(
        new AppError(
          "PasswordsAreSameError",
          HTTP_STATUS_CODES.FORBIDDEN,
          "Passwords are not the same",
          true
        )
      );
    }

    const user = User({
      login: req.body.login,
      email: req.body.email,
      password: req.body.password,
    });

    const newUser = await user.save();

    const token = jwt.sign(
      { id: newUser._id },
      variables.jwtSecret.password[process.env.NODE_ENV],
      {
        expiresIn: variables.jwtSecret.expiresIn[process.env.NODE_ENV],
      }
    );

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        token,
        user,
      },
    });
  });

  const login = tryCatch(async (req, res, next) => {
    const user = await User.findOne({ login: req.body.login }).select(
      "+password"
    );
    const isUserValidated =
      user && (await user.validatePassword(req.body.password));

    if (!isUserValidated) {
      return next(
        new AppError(
          "InvalidUser",
          HTTP_STATUS_CODES.NOT_FOUND,
          "Wrong login or password",
          true
        )
      );
    }

    const token = jwt.sign(
      { id: user._id },
      variables.jwtSecret.password[process.env.NODE_ENV],
      {
        expiresIn: variables.jwtSecret.expiresIn[process.env.NODE_ENV],
      }
    );

    res.status(HTTP_STATUS_CODES.OK).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        token,
        user,
      },
    });
  });

  const forgotPassword = tryCatch(async (req, res, next) => {
    const user = await User.findOne({ login: req.body.login });

    if (!user) {
      return next(
        new AppError(
          "InvalidUser",
          HTTP_STATUS_CODES.NOT_FOUND,
          "Wrong login",
          true
        )
      );
    }

    const resetToken = await user.forgotPasswordToken();

    await user.save({ validateBeforeSave: false });

    res.status(HTTP_STATUS_CODES.OK).json({
      message: HTTP_STATUS_MESSAGES.OK,
      resetToken,
    });
  });

  return { signup, login, forgotPassword };
})();

module.exports = UserController;
