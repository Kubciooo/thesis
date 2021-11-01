const express = require('express');
const ProductPromotionController = require('../controllers/productPromotion.controller');

const productPromotionRouter = express.Router();

productPromotionRouter
  .route('/')
  .get(ProductPromotionController.getAllProductPromotions)
  .post(ProductPromotionController.createProductPromotion);

productPromotionRouter
  .route('/:id')
  .get(ProductPromotionController.getProductPromotionsByProductId);

module.exports = productPromotionRouter;
