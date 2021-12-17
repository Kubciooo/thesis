const mongoose = require('mongoose');
const validator = require('validator');

/**
 * Model sklepu 
 */
const shopSchema = mongoose.Schema({
  name: {
    trim: true,
    type: String,
    maxlength: [40, 'The name must have at most 40 characters'],
    required: true,
    unique: true,
    lowercase: true,
  },
  mainUrl: {
    type: String,
    validate: validator.isURL,
    required: true,
    unique: true,
  },
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
