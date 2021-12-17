const Category = require('../models/category.model');
const AppError = require('../services/error.service');
const tryCatch = require('../utils/tryCatch.util');
const HTTP_STATUS_CODES = require('../constants/httpStatusCodes');
const HTTP_STATUS_MESSAGES = require('../constants/httpStatusMessages');

/**
 * Controller kategorii - zarządzanie kategoriami
 */
const CategoryController = (() => {
  /**
   * Pobranie wszystkich kategorii
   */
  const getAllCategories = tryCatch(async (req, res, next) => {
    const categories = await Category.find();

    res.status(HTTP_STATUS_CODES.OK).json({
      status: 'Success',
      data: {
        categories,
      },
    });
  });

  /**
   * Dodanie kategorii
   */
  const createCategory = tryCatch(async (req, res, next) => {
    const category = await Category.create(req.body);

    res.status(HTTP_STATUS_CODES.OK_POST).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        category,
      },
    });
  });

  /**
   * Pobranie kategorii po id
   */
  const getCategoryById = tryCatch(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(
        new AppError(
          'NotFoundError',
          HTTP_STATUS_CODES.NOT_FOUND,
          `Category with id ${req.params.id} doesn't exist`
        )
      );
    }

    res.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_MESSAGES.OK,
      data: {
        category,
      },
    });
  });

  return { getAllCategories, createCategory, getCategoryById };
})();

module.exports = CategoryController;
