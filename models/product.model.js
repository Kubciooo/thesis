const mongoose = require('mongoose');
const validator = require('validator');

const productSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: validator.isURL,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  ],
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  coupons: [String],
  otherPromotions: [
    {
      name: {
        type: String,
        trim: true,
      },
      url: {
        type: String,
        validate: validator.isURL,
      },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
