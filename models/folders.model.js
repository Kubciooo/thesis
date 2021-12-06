const mongoose = require('mongoose');

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
