const mongoose = require('mongoose');

/**
 * Model promocji produktu. 
 */
const productPromotionSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  type: {
    type: String,
    uppercase: true,
    enum: {
      values: ['COUPON', 'PROMOTION', 'OTHER'],
      message: '{VALUE} is not supported',
    },
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    required: true,
    uppercase: true,
    enum: {
      values: ['PERCENTAGE', 'CASH'],
      message: '{VALUE} is not supported',
    },
  },
  coupon: {
    type: String,
    required: function () {
      return this.type === 'COUPON';
    },
  },
  rating: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    required: function () {
      return this.discountType === 'PERCENTAGE';
    },
    /* istanbul ignore next */
    select: function () {
      return this.discountType === 'PERCENTAGE';
    },
    min: 1,
    max: 100,
    message: '{VALUE} is not between 1 and 99',
  },
  cash: {
    type: Number,
    required: function () {
      return this.discountType === 'CASH';
    },
    /* istanbul ignore next */
    select: function () {
      return this.discountType === 'CASH';
    },
    validate: function (val) {
      return val <= this.startingPrice;
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

const ProductPromotion = mongoose.model(
  'ProductPromotion',
  productPromotionSchema
);

module.exports = ProductPromotion;
