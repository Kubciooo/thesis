const express = require('express');
const CategoryController = require('../controllers/category.controller');

/**
 * Tworzenie ścieżki dla kategorii.
 * Poniżej znajdują się wszystkie ścieżki dla kategorii.
 */
const categoryRouter = express.Router();

categoryRouter
  .route('/')
  .get(CategoryController.getAllCategories)
  .post(CategoryController.createCategory);

categoryRouter.route('/:id').get(CategoryController.getCategoryById);

module.exports = categoryRouter;
