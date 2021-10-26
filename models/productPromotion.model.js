const mongoose = require("mongoose");

const productPromotionSchema = mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Shop",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  type: {
    type: String,
    enum: {
      values: ["COUPON", "PROMOTION", "OTHER"],
      message: "{VALUE} is not supported",
    },
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    required: true,
    enum: {
      values: ["PERCENTAGE", "CASH"],
      message: "{VALUE} is not supported",
    },
  },
  coupon: {
    type: String,
    required: function () {
      return this.type === "COUPON";
    },
  },
  percentage: {
    type: Number,
    required: function () {
      return this.discountType === "PERCENTAGE";
    },
    select: function () {
      return this.discountType === "PERCENTAGE";
    },
    min: 1,
    max: 100,
    message: "{VALUE} is not between 1 and 99",
  },
  cash: {
    type: Number,
    required: function () {
      return this.discountType === "CASH";
    },
    select: function () {
      return this.discountType === "CASH";
    },
    validate: function (val) {
      return val <= this.startingPrice;
    },
    message: "{VALUE} must not exceed the starting price!",
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
    },
  },
});

const ProductPromotion = mongoose.model(
  "ProductPromotion",
  productPromotionSchema
);

module.exports = ProductPromotion;
