const Product = require("../models/product.model");
const AppError = require("../services/error.service");
const tryCatch = require("../utils/tryCatch.util");
const HTTP_STATUS_CODES = require("../constants/httpStatusCodes");
const HTTP_STATUS_MESSAGES = require("../constants/httpStatusMessages");

const ProductController = (() => {
  const getAllProducts = tryCatch(async (req, res, next) => {
    const products = await Product.find(req.query);

    res.status(HTTP_STATUS_CODES.OK).json({
      status: "Success",
      data: {
        products,
      },
    });
  });

  const createProduct = tryCatch(async (req, res, next) => {
    const product = await Product.create(req.body);

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        product,
      },
    });
  });

  const getProductById = tryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError(
        "NotFoundError",
        HTTP_STATUS_CODES.NOT_FOUND,
        `Product with id ${req.params.id} doesn't exist`,
        (isOperational = true)
      ));
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        product,
      },
    });
  });

  return { getAllProducts, createProduct, getProductById };
})();

module.exports = ProductController;
