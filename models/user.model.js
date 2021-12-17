const mongoose = require('mongoose');
const validator = require('validator');
const {
  encryptPassword,
  comparePasswords,
  generatePasswordForgotToken,
} = require('../utils/password.util');

/**
 * Model użytkownika
 */
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

/**
 * Przed zapisem użytkownika do bazy danych, zahaszuj hasło
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await encryptPassword(this.password);
  this.passwordConfirm = undefined;
  next();
});

/**
 * Przed zapisem użytkownika do bazy danych, sprawdź czy hasło zostało zmienione. Jeżeli tak, to ustaw datę zmiany hasła.
 */
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});


/**
 * Funkcja porównująca dwa hasła za pomocą biblioteki bcrypt
 * @param {String} password- hasło do porównania
 * @returns {Boolean} - true jeżeli hasła się zgadzają, false jeżeli nie
 */
userSchema.methods.validatePassword = async function (password) {
  return comparePasswords(password, this.password);
};

/**
 * Funckja sprawdzająca czy token resetujący hasło jest ważny
 * @param {Integer} JWTTimestamp 
 * @returns {Boolean} - true jeżeli token jest ważny, false jeżeli nie
 */
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

/**
 * Funkcja generująca token resetujący hasło użytkownika
 * @returns {String} - token resetujący hasło
 */
userSchema.methods.forgotPasswordToken = async function () {
  const { randomToken, randomTokenEncrypted } =
    await generatePasswordForgotToken();
  this.passwordForgotToken = randomTokenEncrypted;
  this.passwordForgotTokenExpiration = Date.now() + 10 * 60 * 1000;

  return randomToken;
};

const User = mongoose.model('Users', userSchema);

module.exports = User;
