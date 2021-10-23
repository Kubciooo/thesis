const Category = require("@models/category.model");
const tryCatch = require("@utils/tryCatch.util");
const HTTP_STATUS_CODES = require("@constants/httpStatusCodes");

const CategoryController = (() => {
  const getAllCategories = tryCatch(async (req, res, next) => {
    const categories = await Category.find();

    res.status(HTTP_STATUS_CODES.OK).json({
      status: "Success",
      data: {
        categories,
      },
    });
  });

  return { getAllCategories };
})();

module.exports = CategoryController;
