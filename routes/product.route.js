const express = require('express');
const ProductController = require('../controllers/product.controller');

const productRouter = express.Router();

productRouter
  .route('/')
  .get(ProductController.getAllProducts)
  .post(ProductController.createProduct);

productRouter.route('/scrapper').get(ProductController.getProductData);
productRouter.route('/:id').get(ProductController.getProductById);

module.exports = productRouter;
