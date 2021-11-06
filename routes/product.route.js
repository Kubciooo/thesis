const express = require('express');
const ProductController = require('../controllers/product.controller');

const productRouter = express.Router();

productRouter
  .route('/')
  .get(ProductController.getAllProducts)
  .post(ProductController.createProduct);

productRouter.route('/scrapper').get(ProductController.addProductsFromScrapper);
productRouter
  .route('/:id')
  .get(ProductController.getProductById)
  .post(ProductController.followProductById)
  .patch(ProductController.unfollowProductById);

module.exports = productRouter;
