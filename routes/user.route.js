const express = require('express');
const UserController = require('../controllers/user.controller');
const AuthorizationMiddleware = require('../middlewares/authorization.middleware');

const userRouter = express.Router();

userRouter.route('/signup').post(UserController.signup);
userRouter.route('/login').post(UserController.login);
userRouter.route('/forgotPassword').patch(UserController.forgotPassword);
userRouter.route('/resetPassword/:token').post(UserController.resetPassword);
userRouter
  .route('/updatePassword')
  .patch(AuthorizationMiddleware.authorize, UserController.updatePassword);

module.exports = userRouter;
