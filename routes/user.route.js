const express = require("express");
const UserController = require("../controllers/user.controller");

const userRouter = express.Router();

userRouter.route("/signup").post(UserController.signup);
userRouter.route("/login").post(UserController.login);
userRouter.route("/forgotPassword").post(UserController.forgotPassword);

module.exports = userRouter;
