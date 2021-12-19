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

/**
 * Controller produktów - zarządzanie produktami
 */
const ProductController = (() => {
  /**
   * Obserwowanie produktu
   */
  const addFavouriteProduct = tryCatch(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user._id;
    const product = await Product.findById(productId).populate('shop');
    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${req.params.id} doesn't exist`
        )
      );
    }

    const user = await User.findById(userId);

    /* istanbul ignore if */
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `User with id ${req.user._id} doesn't exist`
        )
      );
    }
    user.favouriteProduct = product._id;

    await user.save();
    return res.status(HTTP_STATUS_CODES.OK).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        favouriteProduct: product,
      },
    });
  });

  /**
   * pobranie ulubionego produktu dla użytkownika
   */
  const getFavouriteProduct = tryCatch(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'favouriteProduct',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    /* istanbul ignore if */
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `User with id ${req.user._id} doesn't exist`
        )
      );
    }

    return res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_CODES.OK,
      data: {
        favouriteProduct: user.favouriteProduct,
      },
    });
  });

  /**
   * Dodanie produktów ze sklepów do bazy danych
   */
  /* istanbul ignore next */
  const addProductsFromScrapper = tryCatch(async (req, res, next) => {
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

    if (!category) {
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

    console.log('scrapping data...');

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
    const excludedFields = ['name'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    products = products.find(JSON.parse(queryStr));

    let productsData = await products;

    if (req.query.name) {
      const productName = req.query.name.replace(/%20/g, ' ');
      productsData = productsData.filter((product) => {
        const { separator } = SITES_CONFIG[product.shop.name];
        const productSlug = getSlug(product.name, separator);
        const searchSlug = getSlug(productName, separator);

        return isProductSlugIncluded(searchSlug, productSlug, separator);
      });
    }

    for (const shop of req.user.blockedShops) {
      productsData = productsData.filter(
        (product) => product.shop._id.toString() !== shop.toString()
      );
    }

    const currentUser = await User.findById(req.user._id).populate(
      'productPromotions'
    );

    for (const product of productsData) {
      for (const promotion of currentUser.productPromotions) {
        if (product._id.equals(promotion.product)) {
          if (promotion.type === 'COUPON' || promotion.type === 'PROMOTION') {
            product.coupons.push(promotion.coupon);
            if (promotion.discountType === 'PERCENTAGE') {
              if (product.price === 0) product.price = 10000000;
              product.price = Math.min(
                product.price,
                promotion.startingPrice -
                  (promotion.startingPrice * promotion.percentage) / 100
              );
            } else {
              product.price = Math.min(
                product.price,
                promotion.startingPrice - promotion.cash
              );
            }
          }
        }
      }
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        products: productsData,
      },
    });
  });

  /**
   * Tworzenie nowego produktu
   */
  const createProduct = tryCatch(async (req, res, next) => {
    const product = await Product.create(req.body);

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        product,
      },
    });
  });

  /**
   * Pobieranie produktu po id
   */
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

  /**
   * Zaobserwowanie produktu po id
   */
  const followProductById = tryCatch(async (req, res, next) => {
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
    const user = await User.findById(req.user._id);
    /* istanbul ignore if */
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,

          `User with id ${req.user._id} doesn't exist`
        )
      );
    }
    /**
     * Sprawdzenie czy produkt nie jest już obserwowany przez użytkownika
     */
    if (!user.products.includes(productId)) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { products: product._id },
        },
        {
          new: true,
        }
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user,
      },
    });
  });

  /**
   * Usunięcie prodktu z obserwowanych
   */
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

    /* istanbul ignore if */
    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `User with id ${req.user._id} doesn't exist`
        )
      );
    }

    req.user = user;
    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user,
      },
    });
  });

  /**
   * Pobranie wszystkich obserwowanych produktów
   */
  const getAllFollowedProducts = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    /* istanbul ignore if */
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
    addFavouriteProduct,
    getFavouriteProduct,
    getAllFollowedProducts,
  };
})();

module.exports = ProductController;
