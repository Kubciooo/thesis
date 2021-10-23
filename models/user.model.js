const mongoose = require("mongoose");
const validator = require("validator");
const { encryptPassword, comparePasswords } = require("../utils/password.util");

const userSchema = mongoose.Schema({
  login: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validation: validator.isEmail,
  },
  password: String,
});

userSchema.methods.setPassword = function (password) {
  this.password = encryptPassword(password);
};

userSchema.methods.validatePassword = function (password) {
  return comparePasswords(password, this.password);
};

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
