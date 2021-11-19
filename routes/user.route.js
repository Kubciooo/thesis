const express = require('express');
const ProductPromotionController = require('../controllers/productPromotion.controller');
const ProductController = require('../controllers/product.controller');
const UserController = require('../controllers/user.controller');
const AuthorizationMiddleware = require('../middlewares/authorization.middleware');
const UserProductsController = require('../controllers/userProducts.controller');

const userRouter = express.Router();

userRouter.route('/signup').post(UserController.signup);
userRouter.route('/login').post(UserController.login);
userRouter.route('/forgotPassword').post(UserController.forgotPassword);
userRouter.route('/resetPassword/:token').post(UserController.resetPassword);
userRouter
  .route('/updatePassword')
  .patch(AuthorizationMiddleware.authorize, UserController.updatePassword);

userRouter
  .route('/products')
  .get(
    AuthorizationMiddleware.authorize,
    ProductController.getAllFollowedProducts
  );
userRouter
  .route('/productPromotions')
  .get(
    AuthorizationMiddleware.authorize,
    ProductPromotionController.getAllFollowedProductPromotions
  );

userRouter
  .route('/favourites/product')
  .get(AuthorizationMiddleware.authorize, ProductController.getFavouriteProduct)
  .post(
    AuthorizationMiddleware.authorize,
    ProductController.addFavouriteProduct
  );

userRouter
  .route('/favourites/folder')
  .get(
    AuthorizationMiddleware.authorize,
    UserProductsController.getFavouriteUserProducts
  )
  .post(
    AuthorizationMiddleware.authorize,
    UserProductsController.addFavouriteUserProducts
  );

userRouter
  .route('/likes')
  .get(AuthorizationMiddleware.authorize, UserController.getLikes)
  .post(AuthorizationMiddleware.authorize, UserController.setLikes);
module.exports = userRouter;
