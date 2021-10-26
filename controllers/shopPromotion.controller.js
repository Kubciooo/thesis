const ShopPromotion = require("../models/shopPromotion.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const HTTP_STATUS_MESSAGES = require("../constants/httpStatusMessages");
const Shop = require("../models/shop.model");

const ShopPromotionController = (() => {
  const getAllShopPromotions = tryCatch(async (req, res, next) => {
    const shopPromotions = await ShopPromotion.find(req.query).sort(
      "-expiresAt"
    );

    res.status(HTTP_STATUS_CODES.OK).json({
      status: "Success",
      data: {
        shopPromotions,
      },
    });
  });

  const createShopPromotion = tryCatch(async (req, res, next) => {
    const shopPromotion = await ShopPromotion.create(req.body);

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        shopPromotion,
      },
    });
  });

  const getShopPromotionsByShopId = tryCatch(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    const shopPromotions = await ShopPromotion.find({
      shop: req.params.id,
    }).sort("-expiresAt");

    if (!shop) {
      return next(
        new AppError(
          "NotFoundError",
          HTTP_STATUS_CODES.NOT_FOUND,
          `Shop with id ${req.params.id} doesn't exist`,
          (isOperational = true)
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        shopPromotions,
      },
    });
  });

  return {
    getAllShopPromotions,
    createShopPromotion,
    getShopPromotionsByShopId,
  };
})();

module.exports = ShopPromotionController;
