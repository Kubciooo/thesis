const mongoose = require("mongoose");
const validator = require("validator");
const { encryptPassword, comparePasswords } = require("@utils/password.util");

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
  shops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      unique: true,
    },
  ],

  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      unique: true,
    },
  ],
  password: String,
});

userSchema.methods.setPassword = function (password) {
  this.password = encryptPassword(password);
};

userSchema.methods.validatePassword = function (password) {
  return comparePasswords(password, this.password);
};

const User = mongoose.model("User", userSchema);

// const user = await User.findById()
// user.shops.push(shopID)
// user.shops.filter(shopId => shopId !== id);
// await user.save({validateBeforeSave: false});

module.exports = User;
