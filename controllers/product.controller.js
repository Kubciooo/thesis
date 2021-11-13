/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const getSlug = require('../utils/getSlug.util');
const isProductSlugIncluded = require('../utils/isProductSlugIncluded.util');
const Scrapper = require('../services/scrapper.service');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');
const SITES_CONFIG = require('../constants/sites');

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
    let products = Product.find().populate('shop');

    const queryObj = { ...req.query };
    const excludedFields = ['page', 'limit', 'name'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    products = products.find(JSON.parse(queryStr));

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 500;
    const skip = (page - 1) * limit;

    products = products.skip(skip).limit(limit);

    let productsData = await products;

    console.dir(
      productsData.map((el) => el.name),
      { depth: null }
    );
    if (req.query.name) {
      const productName = req.query.name.replace(/%20/g, ' ');
      productsData = productsData.filter((product) => {
        const { separator } = SITES_CONFIG[product.shop.name];
        const productSlug = getSlug(product.name, separator);
        const searchSlug = getSlug(productName, separator);

        return isProductSlugIncluded(searchSlug, productSlug, separator);
      });
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        products: productsData,
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

  const followProductById = tryCatch(async (req, res, next) => {
    const { user } = req;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${productId} doesn't exist`
        )
      );
    }
    if (!user.products.includes(product._id)) {
      user.products.push(product._id);
    }
    await user.save();

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user,
      },
    });
  });

  const unfollowProductById = tryCatch(async (req, res, next) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${productId} doesn't exist`
        )
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { products: product._id },
      },
      {
        new: true,
      }
    );

    req.user = user;
    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user,
      },
    });
  });

  const getAllFollowedProducts = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `User with id ${req.user._id} doesn't exist`
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        products: user.products,
      },
    });
  });

  return {
    getAllProducts,
    createProduct,
    getProductById,
    addProductsFromScrapper,
    followProductById,
    unfollowProductById,
    getAllFollowedProducts,
  };
})();

module.exports = ProductController;
