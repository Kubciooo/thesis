const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');
const variables = require('../constants/variables');
const Emails = require('../utils/emails.util');

const UserController = (() => {
  const signup = tryCatch(async (req, res, next) => {
    console.log(req.body);
    if (req.body.password !== req.body.retypePassword) {
      return next(
        new AppError(
          'PasswordsAreSameError',
          HTTP_STATUS_CODES.FORBIDDEN,
          'Passwords are not the same',
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
      '+password'
    );
    const isUserValidated =
      user && (await user.validatePassword(req.body.password));

    if (!isUserValidated) {
      return next(
        new AppError(
          'InvalidUser',
          HTTP_STATUS_CODES.NOT_FOUND,
          'Wrong login or password',
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
          'InvalidUser',
          HTTP_STATUS_CODES.NOT_FOUND,
          'Wrong login',
          true
        )
      );
    }

    const resetToken = await user.forgotPasswordToken();

    await user.save({ validateBeforeSave: false });
    try {
      await Emails.send(user.email, resetToken);

      res.status(HTTP_STATUS_CODES.OK).json({
        message: HTTP_STATUS_MESSAGES.OK,
        resetToken,
      });
    } catch (err) {
      user.passwordForgotToken = undefined;
      user.passwordForgotTokenExpiration = undefined;

      await user.save({ validateBeforeSave: false });
      return next(err);
    }
  });

  const updatePassword = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).select('+password');
    const isUserValidated = await user.validatePassword(
      req.body.currentPassword
    );

    if (!isUserValidated) {
      return next(
        new AppError(
          'InvalidUser',
          HTTP_STATUS_CODES.NOT_FOUND,
          'Wrong password',
          true
        )
      );
    }

    user.password = req.body.newPassword;
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      variables.jwtSecret.password[process.env.NODE_ENV],
      {
        expiresIn: variables.jwtSecret.expiresIn[process.env.NODE_ENV],
      }
    );

    req.user = user;

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        token,
        user,
      },
    });
  });

  const resetPassword = tryCatch(async (req, res, next) => {
    const resetToken = req.params.token;
    const hashedToken = crypto
      .createHash('sha512')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      passwordForgotToken: hashedToken,
      passwordForgotTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          'Invalid or expired token'
        )
      );
    }

    if (req.body.password !== req.body.retypePassword) {
      return next(
        new AppError(
          'PasswordsAreSameError',
          HTTP_STATUS_CODES.FORBIDDEN,
          'Passwords are not the same',
          true
        )
      );
    }

    user.password = req.body.password;
    user.passwordForgotToken = undefined;
    user.passwordForgotTokenExpiration = undefined;
    await user.save();

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

  const getLikes = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          'User not found'
        )
      );
    }

    return res.status(HTTP_STATUS_CODES.OK).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        likes: user.userFavouritesMinUsers,
      },
    });
  });

  const setLikes = tryCatch(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { userFavouritesMinUsers: req.body.likes },
      { new: true }
    );
    // console.log(user);
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          'User not found'
        )
      );
    }

    req.user = user;

    return res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        likes: user.userFavouritesMinUsers,
      },
    });
  });

  return {
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    getLikes,
    setLikes,
  };
})();

module.exports = UserController;
