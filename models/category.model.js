const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    minlength: [3, 'The category name must have at least 3 characters'],
    maxlength: [40, 'The name must have at most 40 characters'],
    required: true,
    unique: true,
  },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
