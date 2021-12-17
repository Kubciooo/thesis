const mongoose = require('mongoose');

/**
 * Model folderu
 */
const folderSchema = mongoose.Schema({
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

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
