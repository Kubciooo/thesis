const express = require('express');
const ShopPromotionController = require('../controllers/shopPromotion.controller');

/**
 * Tworzenie ścieżki dla promocji sklepów - jest to przykład możliwego rozwoju aplikacji.
 * Poniżej znajdują się wszystkie ścieżki dla promocji sklepów.
 */
const shopPromotionRouter = express.Router();

shopPromotionRouter
  .route('/')
  .get(ShopPromotionController.getAllShopPromotions)
  .post(ShopPromotionController.createShopPromotion);

shopPromotionRouter
  .route('/:id')
  .get(ShopPromotionController.getShopPromotionsByShopId);

module.exports = shopPromotionRouter;
