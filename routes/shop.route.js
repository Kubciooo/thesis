const express = require('express');
const ShopController = require('../controllers/shop.controller');

const shopRouter = express.Router();
/**
 * Tworzenie ścieżki dla sklepów - jest to przykład możliwego rozwoju aplikacji.
 * Poniżej znajdują się wszystkie ścieżki dla sklepów.
 */
shopRouter
  .route('/')
  .get(ShopController.getAllShops)
  .post(ShopController.createShop);

shopRouter.route('/:id').get(ShopController.getShopById);

module.exports = shopRouter;
