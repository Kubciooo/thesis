const mongoose = require("mongoose");
const validator = require("validator");
const { encryptPassword, comparePasswords } = require("../utils/password.util");

const userSchema = mongoose.Schema({
  login: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: validator.isEmail,
  },
  shops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: [],
    },
  ],

  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: [],
    },
  ],
  password: {
    type: String,
    required: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await encryptPassword(this.password);
  next();
});

userSchema.methods.validatePassword = async function (password) {
  return comparePasswords(password, this.password);
};

const User = mongoose.model("Users", userSchema);

// const user = await User.findById()
// user.shops.push(shopID)
// user.shops.filter(shopId => shopId !== id);
// await user.save({validateBeforeSave: false});

module.exports = User;
