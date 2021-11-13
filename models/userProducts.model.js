const mongoose = require('mongoose');

const userProductSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Products',
      required: true,
    },
  ],
});

const Product = mongoose.model('UserProduct', userProductSchema);

module.exports = Product;
