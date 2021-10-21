const mongoose = require('mongoose');
const validator = require('validator');

const productPromotionSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: validator.isUrl,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop',
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Shop',
  },
  type: {
    type: String,
    enum: ['COUPON', 'PROMOTION', 'OTHER'],
    message: "{VALUE} is not supported",
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    required: true,
    enum: ['PERCENTAGE', 'CASH'],
    message: "{VALUE} is not supported",
  },
  percentage: {
    type: Number,
    required: this.discountType === 'PERCENTAGE',
    validate: function(val) {
      return val <= 100 && val > 0; 
    },
    message: "{VALUE} is not between 0 and 99"
  },
  cash: {
    type: Number,
    required: this.discountType === 'CASH',
    validate: function(val) {
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
    validate: function(val) {
      return val > this.startsAt;
    }
  }
});

const ProductPromotionModel = mongoose.model('ProductPromotion', productPromotionSchema);

module.exports = ProductPromotionModel;