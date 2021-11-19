const UserProducts = require('../models/userProducts.model');
const User = require('../models/user.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');
const Product = require('../models/product.model');

const UserProductsController = (() => {
  const addFavouriteUserProducts = tryCatch(async (req, res, next) => {
    const { folderId } = req.body;
    const userId = req.user._id;
    const folder = await UserProducts.findById(folderId).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    if (!folder) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Folder with id ${folderId} doesn't exist`
        )
      );
    }
    const user = await User.findByIdAndUpdate(userId, {
      favouriteUserProducts: folder._id,
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
    req.user = user;

    return res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        favouriteUserProducts: folder,
      },
    });
  });

  const getFavouriteUserProducts = tryCatch(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'favouriteUserProducts',
      model: 'UserProduct',
      populate: {
        path: 'products',
        model: 'Product',
        populate: {
          path: 'shop',
          model: 'Shop',
        },
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

    return res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_CODES.OK,
      data: {
        favouriteUserProducts: user.favouriteUserProducts,
      },
    });
  });

  const getAllUserProducts = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
      path: 'userProducts',
      model: 'UserProduct',
      populate: {
        path: 'products',
        model: 'Product',
        populate: {
          path: 'shop',
          model: 'Shop',
        },
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
      status: 'Success',
      data: {
        userProducts: user.userProducts,
      },
    });
  });

  const deleteUserProducts = tryCatch(async (req, res, next) => {
    const user = req.user.id;

    if (!user) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `User with id ${req.user._id} doesn't exist`
        )
      );
    }

    const deletedUserProduct = await UserProducts.findByIdAndDelete(
      req.params.id
    );

    if (!deletedUserProduct) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `UserProduct with id ${req.params.id} doesn't exist`
        )
      );
    }

    const newUser = await User.findByIdAndUpdate(
      user,
      {
        $pull: { userProducts: deletedUserProduct._id },
      },
      {
        new: true,
      }
    );

    req.user = newUser;

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        newUser,
      },
    });
  });

  const deleteProductFromUserProducts = tryCatch(async (req, res, next) => {
    const product = await Product.findById(req.body.productId);

    if (!product) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Product with id ${req.body.productId} doesn't exist`
        )
      );
    }
    const userProducts = await UserProducts.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { products: product._id },
      },
      {
        new: true,
      }
    ).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        userProducts,
      },
    });
  });

  const createUserProducts = tryCatch(async (req, res, next) => {
    let userProducts = await UserProducts.create(req.body);
    userProducts = await userProducts.populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    const user = await User.findByIdAndUpdate(req.user._id, {
      $push: { userProducts: userProducts._id },
    });

    req.user = user;

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        userProducts,
      },
    });
  });

  const addProductToUserProducts = tryCatch(async (req, res, next) => {
    const userProducts = await UserProducts.findById(req.params.id).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });
    if (!userProducts) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `UserProducts with id ${req.params.id} doesn't exist`
        )
      );
    }
    const { productId } = req.body;

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
    if (!userProducts.products.includes(product._id)) {
      userProducts.products.push(product._id);
    }
    await userProducts.save();

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        userProducts,
      },
    });
  });

  return {
    getAllUserProducts,
    createUserProducts,
    addProductToUserProducts,
    addFavouriteUserProducts,
    getFavouriteUserProducts,
    deleteUserProducts,
    deleteProductFromUserProducts,
  };
})();

module.exports = UserProductsController;
