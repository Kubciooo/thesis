const mongoose = require('mongoose');
const validator = require('validator');
const {
  encryptPassword,
  comparePasswords,
  generatePasswordForgotToken,
} = require('../utils/password.util');

const userSchema = mongoose.Schema({
  login: {
    type: String,
    unique: true,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    validate: validator.isEmail,
  },
  shops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: [],
      required: true,
    },
  ],

  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: [],
      required: true,
    },
  ],
  productPromotions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductPromotion',
      default: [],
      required: true,
    },
  ],
  favouriteProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
    select: true,
  },
  blockedShops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: [],
      required: true,
    },
  ],
  shopPromotions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopPromotion',
      default: [],
      required: true,
    },
  ],
  password: {
    type: String,
    required: true,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordForgotToken: {
    type: String,
  },
  passwordForgotTokenExpiration: {
    type: Date,
  },
  folders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: [],
    },
  ],
  favouriteFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    select: true,
  },
  userFavouritesMinUsers: {
    type: Number,
    default: 0,
    required: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  this.password = await encryptPassword(this.password);
  next();
});

userSchema.methods.validatePassword = async function (password) {
  return comparePasswords(password, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.forgotPasswordToken = async function () {
  const { randomToken, randomTokenEncrypted } =
    await generatePasswordForgotToken();
  this.passwordForgotToken = randomTokenEncrypted;
  this.passwordForgotTokenExpiration = Date.now() + 10 * 60 * 1000;

  return randomToken;
};

const User = mongoose.model('Users', userSchema);

module.exports = User;
