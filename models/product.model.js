const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = mongoose.Schema({
  // name, category (ewentualnie), shop_id, url
  name: {
    type: String,
    maxlength: [40, "The name must have at most 40 characters"],
    required: true,
    unique: true,
    index: true,
    lowercase: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  prices: [
    {
      shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
      },
      url: {
        type: String,
        required: true,
        validation: validator.isURL,
      },
      price: {
        type: Number,
        required: true,
      },
      otherPromotions: [String],
    },
  ],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
