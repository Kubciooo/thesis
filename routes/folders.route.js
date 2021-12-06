const express = require('express');
const userProductsController = require('../controllers/folders.controller');

const foldersRoute = express.Router();

foldersRoute
  .route('/')
  .get(userProductsController.getAllFolders)
  .post(userProductsController.createFolder);

foldersRoute
  .route('/:id')
  .delete(userProductsController.deleteFolder)
  .put(userProductsController.addProductToFolder)
  .patch(userProductsController.deleteProductFromFolder);
module.exports = foldersRoute;
