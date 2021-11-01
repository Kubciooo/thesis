const express = require('express');
const ShopController = require('../controllers/shop.controller');

const shopRouter = express.Router();

shopRouter
  .route('/')
  .get(ShopController.getAllShops)
  .post(ShopController.createShop);

shopRouter.route('/:id').get(ShopController.getShopById);

module.exports = shopRouter;
