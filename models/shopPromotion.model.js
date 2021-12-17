const mongoose = require('mongoose');
const validator = require('validator');

/**
 * Model promocji sklepu - jest to przykład możliwego rozwoju aplikacji.
 */
const shopPromotionSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: validator.isURL,
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
  ],
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop',
  },
  type: {
    type: String,
    required: true,
    uppercase: true,
    enum: {
      values: ['COUPON', 'PROMOTION', 'OTHER'],
      message: '{VALUE} is not supported',
    },
  },
  coupon: {
    trim: true,
    type: String,
    required: function () {
      return this.type === 'COUPON';
    },
  },
  discountType: {
    type: String,
    uppercase: true,
    required: true,
    enum: {
      values: ['PERCENTAGE', 'CASH'],
      message: '{VALUE} is not supported',
    },
  },
  percentage: {
    type: Number,
    required: function () {
      return this.discountType === 'PERCENTAGE';
    },
    min: 1,
    max: 100,
  },
  cash: {
    type: Number,
    required: function () {
      return this.discountType === 'CASH';
    },
    message: '{VALUE} must not exceed the starting price!',
  },
  startsAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  expiresAt: {
    type: Date,
    required: true,
    validate: function (val) {
      return val > this.startsAt && val > Date.now();
    },
  },
});

const ShopPromotion = mongoose.model('ShopPromotion', shopPromotionSchema);

module.exports = ShopPromotion;
