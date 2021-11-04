/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');
const Category = require('../models/category.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const Scrapper = require('../services/scrapper.service');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');

const ProductController = (() => {
  const addProductsFromScrapper = tryCatch(async (req, res, next) => {
    /**
     * @todo use https://express-validator.github.io/docs/index.html
     */
    if (
      !(
        req.body.minPrice &&
        req.body.maxPrice &&
        req.body.productName &&
        req.body.shops &&
        req.body.categoryId
      )
    ) {
      const blankItems = [];
      if (!req.body.minPrice) blankItems.push('minPrice');
      if (!req.body.maxPrice) blankItems.push('maxPrice');
      if (!req.body.productName) blankItems.push('productName');
      if (!req.body.shops) blankItems.push('shops');
      if (!req.body.categoryId) blankItems.push('categoryId');

      return next(
        new AppError(
          'HTTPValidationError',
          HTTP_STATUS_CODES.INVALID,
          `{${blankItems.join(', ')}} fields are required.`
        )
      );
    }

    const { minPrice, maxPrice, productName, shops, categoryId } = req.body;
    const shopsData = [];
    const shopsNames = [];

    const category = await Category.findById(categoryId);

    if (!categoryId) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Category with id ${categoryId} doesn't exist`
        )
      );
    }

    for (const shop of shops) {
      const shopDB = await Shop.findById(shop);
      if (shopDB) {
        shopsData.push(shopDB);
        shopsNames.push({
          name: shopDB.name,
          id: shopDB._id,
          category: category._id,
        });
      }
    }

    const scrapData = await Scrapper.scrapPages(
      shopsNames,
      parseFloat(minPrice),
      parseFloat(maxPrice),
      productName
    );

    const products = [];
    for (const prod of scrapData) {
      const productDB = await Product.findOne({ url: prod.url });

      if (!productDB) {
        products.push(await Product.create(prod));
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        products,
      },
    });
  });

  const getAllProducts = tryCatch(async (req, res, next) => {
    const products = await Product.find(req.query);

    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        products,
      },
    });
  });

  const createProduct = tryCatch(async (req, res, next) => {
    const product = await Product.create(req.body);

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        product,
      },
    });
  });

  const getProductById = tryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${req.params.id} doesn't exist`
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        product,
      },
    });
  });

  return {
    getAllProducts,
    createProduct,
    getProductById,
    addProductsFromScrapper,
  };
})();

module.exports = ProductController;
