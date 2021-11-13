const express = require('express');
const ProductController = require('../controllers/product.controller');

const productRouter = express.Router();

productRouter
  .route('/')
  .get(ProductController.getAllProducts)
  .post(ProductController.createProduct);

productRouter
  .route('/scrapper')
  .post(ProductController.addProductsFromScrapper);
productRouter.route('/user').get(ProductController.getAllFollowedProducts);
productRouter
  .route('/:id')
  .get(ProductController.getProductById)
  .patch(ProductController.followProductById)
  .delete(ProductController.unfollowProductById);

module.exports = productRouter;
