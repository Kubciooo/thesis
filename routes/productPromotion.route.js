const express = require('express');
const ProductPromotionController = require('../controllers/productPromotion.controller');

/**
 * Tworzenie ścieżki dla promocji produktów.
 * Poniżej znajdują się wszystkie ścieżki dla promocji produktów.
 */
const productPromotionRouter = express.Router();

productPromotionRouter
  .route('/')
  .get(ProductPromotionController.getAllProductPromotions)
  .post(ProductPromotionController.createProductPromotion);

productPromotionRouter
  .route('/:id')
  .get(ProductPromotionController.getProductPromotionsByProductId)
  .patch(ProductPromotionController.followProductPromotionById)
  .delete(ProductPromotionController.unfollowProductPromotionById);

module.exports = productPromotionRouter;
