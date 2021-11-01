const Shop = require('../models/shop.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');

const ShopController = (() => {
  const getAllShops = tryCatch(async (req, res, next) => {
    const shops = await Shop.find();

    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        shops,
      },
    });
  });

  const createShop = tryCatch(async (req, res, next) => {
    const shop = await Shop.create(req.body);

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        shop,
      },
    });
  });

  const getShopById = tryCatch(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Shop with id ${req.params.id} doesn't exist`
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        shop,
      },
    });
  });

  return { getAllShops, createShop, getShopById };
})();

module.exports = ShopController;
