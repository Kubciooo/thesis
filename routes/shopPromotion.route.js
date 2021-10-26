const express = require("express");
const ShopPromotionController = require("../controllers/shopPromotion.controller");

const shopPromotionRouter = express.Router();

shopPromotionRouter
  .route("/")
  .get(ShopPromotionController.getAllShopPromotions)
  .post(ShopPromotionController.createShopPromotion);

shopPromotionRouter
  .route("/:id")
  .get(ShopPromotionController.getShopPromotionsByShopId);

module.exports = shopPromotionRouter;
