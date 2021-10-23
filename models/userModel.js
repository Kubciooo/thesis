const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = mongoose.Schema({
  login: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validation: validator.isEmail,
  }
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;