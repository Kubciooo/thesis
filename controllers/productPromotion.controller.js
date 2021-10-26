const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const HTTP_STATUS_MESSAGES = require("../constants/httpStatusMessages");
const Product = require("../models/product.model");
const ProductPromotion = require("../models/productPromotion.model");

const ProductPromotionController = (() => {
  const getAllProductPromotions = tryCatch(async (req, res, next) => {
    const productPromotions = await ProductPromotion.find(req.query).sort(
      "-expiresAt"
    );

    res.status(HTTP_STATUS_CODES.OK).json({
      status: "Success",
      data: {
        productPromotions,
      },
    });
  });

  const createProductPromotion = tryCatch(async (req, res, next) => {
    const productPromotion = await ProductPromotion.create(req.body);

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        productPromotion,
      },
    });
  });

  const getProductPromotionsByProductId = tryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    const productPromotions = await ProductPromotion.find({
      product: req.params.id,
    }).sort("-expiresAt");

    if (!product) {
      return next(
        new AppError(
          "NotFoundError",
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${req.params.id} doesn't exist`,
          (isOperational = true)
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        productPromotions,
      },
    });
  });

  return {
    getAllProductPromotions,
    createProductPromotion,
    getProductPromotionsByProductId,
  };
})();

module.exports = ProductPromotionController;
