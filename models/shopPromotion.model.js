const mongoose = require('mongoose');
const validator = require('validator');

const productPromotionSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: validator.isUrl,
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category',
  }],
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop',
  },
  type: {
    type: String,
    enum: {
      values: ['COUPON', 'PROMOTION', 'OTHER'],
      message: "{VALUE} is not supported",
    },
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 1,
    message: "{VALUE} must be more than 0"
  },
  discountType: {
    type: String,
    required: true,
    enum: {
      values: ['PERCENTAGE', 'CASH'],
      message: "{VALUE} is not supported",
    }
  },
  percentage: {
    type: Number,
    required: this.discountType === 'PERCENTAGE',
    min: 1,
    max: 100,
  },
  cash: {
    type: Number,
    required: this.discountType === 'CASH',
    validate: function (val) {
      return val <= this.startingPrice;
    },
    message: "{VALUE} must not exceed the starting price!"
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
      return val > this.startsAt;
    }
  }
});

const ProductPromotion = mongoose.model('ProductPromotion', productPromotionSchema);

module.exports = ProductPromotion;