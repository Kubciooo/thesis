const express = require('express');
const userProductsController = require('../controllers/userProducts.controller');

const userProductsRouter = express.Router();

userProductsRouter
  .route('/')
  .get(userProductsController.getAllUserProducts)
  .post(userProductsController.createUserProducts);

userProductsRouter
  .route('/:id')
  .delete(userProductsController.deleteUserProducts)
  .put(userProductsController.addProductToUserProducts)
  .patch(userProductsController.deleteProductFromUserProducts);
module.exports = userProductsRouter;
