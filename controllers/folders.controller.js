const Folders = require('../models/folders.model');
const User = require('../models/user.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');
const Product = require('../models/product.model');

const FoldersController = (() => {
  const setFavouriteFolder = tryCatch(async (req, res, next) => {
    const { folderId } = req.body;
    const userId = req.user._id;
    const folder = await Folders.findById(folderId).populate({
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
      favouriteFolder: folder._id,
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
    req.user = user;

    return res.status(HTTP_STATUS_CODES.OK_POST).json({
      message: HTTP_STATUS_MESSAGES.OK,
      data: {
        favouriteFolder: folder,
      },
    });
  });

  const getFavouriteFolder = tryCatch(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'favouriteFolder',
      model: 'Folder',
      populate: {
        path: 'products',
        model: 'Product',
        populate: {
          path: 'shop',
          model: 'Shop',
        },
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
        favouriteFolder: user.favouriteFolder,
      },
    });
  });

  const getAllFolders = tryCatch(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
      path: 'folders',
      model: 'Folder',
      populate: {
        path: 'products',
        model: 'Product',
        populate: {
          path: 'shop',
          model: 'Shop',
        },
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
      status: 'Success',
      data: {
        folders: user.folders,
      },
    });
  });

  const deleteFolder = tryCatch(async (req, res, next) => {
    const user = req.user.id;

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

    const deletedFolder = await Folders.findByIdAndDelete(req.params.id);

    if (!deletedFolder) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Folder with id ${req.params.id} doesn't exist`
        )
      );
    }

    const newUser = await User.findByIdAndUpdate(
      user,
      {
        $pull: { folders: deletedFolder._id },
      },
      {
        new: true,
      }
    );

    req.user = newUser;

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        newUser,
      },
    });
  });

  const deleteProductFromFolder = tryCatch(async (req, res, next) => {
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
    const folder = await Folders.findByIdAndUpdate(
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

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        folder,
      },
    });
  });

  const createFolder = tryCatch(async (req, res, next) => {
    if (!req.body.products || req.body.products.length === 0) {
      return next(
        new AppError(
          'BadRequestError',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'Folder must have at least one product'
        )
      );
    }

    let folder = await Folders.create(req.body);
    folder = await folder.populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'shop',
        model: 'Shop',
      },
    });

    const user = await User.findByIdAndUpdate(req.user._id, {
      $push: { folders: folder._id },
    });

    req.user = user;
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

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        folder,
      },
    });
  });

  const addProductToFolder = tryCatch(async (req, res, next) => {
    const folder = await Folders.findById(req.params.id).populate({
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
          `Folder with id ${req.params.id} doesn't exist`
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
    if (!folder.products.includes(product._id)) {
      folder.products.push(product._id);
    }
    await folder.save();

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        folder,
      },
    });
  });

  return {
    getAllFolders,
    createFolder,
    addProductToFolder,
    setFavouriteFolder,
    getFavouriteFolder,
    deleteFolder,
    deleteProductFromFolder,
  };
})();

module.exports = FoldersController;
