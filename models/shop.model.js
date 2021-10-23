const mongoose = require('mongoose');
const validator = require('validator');

const shopSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: [40, 'The name must have at most 40 characters'],
    required: true,
  },
  mainUrl: {
    type: String,
    validate: validator.isUrl,
    required: true
  },
});

const ShopModel = mongoose.model('Shop', shopSchema);

module.exports = ShopModel;