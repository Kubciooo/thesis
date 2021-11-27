const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const ProductPromotion = require('../models/productPromotion.model');
const { checkProductCoupon } = require('../services/scrapper.service');

const ProductPromotionController = (() => {
  const getAllProductPromotions = tryCatch(async (req, res, next) => {
    let productPromotions = await ProductPromotion.find({
      ...req.query,
      rating: { $gte: req.user.userFavouritesMinUsers },
    })
      .sort('-expiresAt')
      .populate('product');

    for (let i = 0; i < req.user.blockedShops.length; i += 1) {
      const shop = req.user.blockedShops[i];
      productPromotions = productPromotions.filter(
        (promotion) => promotion.product.shop.toString() !== shop.toString()
      );
    }
    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        productPromotions,
      },
    });
  });

  const followProductPromotionById = tryCatch(async (req, res, next) => {
    const { user } = req;
    const promotionId = req.params.id;

    const promotion = await ProductPromotion.findById(promotionId);
    if (!promotion) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `ProductPromotion with id ${promotionId} doesn't exist`
        )
      );
    }
    if (!user.productPromotions.includes(promotion._id)) {
      await ProductPromotion.findByIdAndUpdate(promotionId, {
        rating: promotion.rating + 1,
      });
      req.user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { productPromotions: promotionId },
        },
        {
          new: true,
        }
      );
    } else {
      return next(
        new AppError(
          'BadRequestError',
          HTTP_STATUS_CODES.BAD_REQUEST,
          `User with id ${user._id} already follows ProductPromotion with id ${promotionId}`
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user: req.user,
      },
    });
  });

  const unfollowProductPromotionById = tryCatch(async (req, res, next) => {
    const promotionId = req.params.id;

    const productPromotion = await ProductPromotion.findById(promotionId);
    if (!productPromotion) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `ProductPromotion with id ${promotionId} doesn't exist`
        )
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { productPromotions: productPromotion._id },
      },
      {
        new: true,
      }
    );
    await productPromotion.update({ rating: productPromotion.rating - 1 });

    req.user = user;
    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        user,
      },
    });
  });

  const getAllFollowedProductPromotions = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
      path: 'productPromotions',
      model: 'ProductPromotion',
      populate: {
        path: 'product',
        model: 'Product',
      },
    });

    let { productPromotions } = user;

    for (let i = 0; i < req.user.blockedShops.length; i += 1) {
      const shop = req.user.blockedShops[i];
      productPromotions = productPromotions.filter(
        (promotion) => promotion.product.shop.toString() !== shop.toString()
      );
    }

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
        productPromotions: user.productPromotions,
      },
    });
  });

  const createProductPromotion = tryCatch(async (req, res, next) => {
    const productPromotion = new ProductPromotion(req.body);
    console.log(req.body.userValidation);
    const product = await Product.findById(req.body.product).populate('shop');

    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${req.body.product} doesn't exist`
        )
      );
    }

    if (productPromotion.type === 'COUPON' && !req.body.userValidation) {
      const [productPriceBefore, productPriceAfter] = await checkProductCoupon(
        {
          url: product.url,
          shop: product.shop.name,
        },
        productPromotion.coupon
      );
      if (productPriceBefore !== productPriceAfter) {
        const newSnapshot = {
          coupons: product.coupons.concat([productPromotion.coupon]),
          price: productPriceAfter,
          otherPromotions: product.otherPromotions,
          updatedAt: Date.now(),
        };

        product.coupons.push(productPromotion.coupon);
        product.price = Math.min(product.price, productPriceAfter);
        product.snapshots.push(newSnapshot);

        await product.save();
        res.status(HTTP_STATUS_CODES.OK_POST).json({
          status: HTTP_STATUS_MESSAGES.OK,
          data: {
            product,
          },
        });
      } else {
        return next(
          new AppError(
            'InvalidCouponError',
            HTTP_STATUS_CODES.BAD_REQUEST,
            'Coupon is not valid'
          )
        );
      }
    } else {
      await productPromotion.save();

      res.status(HTTP_STATUS_CODES.OK_POST).json({
        status: HTTP_STATUS_MESSAGES.OK,
        data: {
          productPromotion,
        },
      });
    }
  });

  const getProductPromotionsByProductId = tryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    const productPromotions = await ProductPromotion.find({
      product: req.params.id,
    }).sort('-expiresAt');

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
        productPromotions,
      },
    });
  });

  const getProductPromotionsByProductUrl = tryCatch(async (req, res, next) => {
    const product = await Product.findOne({ url: req.params.url });
    const productPromotions = await ProductPromotion.find({
      product: product._id,
    }).sort('-expiresAt');

    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with url ${req.params.url} doesn't exist`
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
    getProductPromotionsByProductUrl,
    followProductPromotionById,
    unfollowProductPromotionById,
    getAllFollowedProductPromotions,
  };
})();

module.exports = ProductPromotionController;
