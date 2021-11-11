const express = require('express');
const ProductPromotionController = require('../controllers/productPromotion.controller');
const ProductController = require('../controllers/product.controller');
const UserController = require('../controllers/user.controller');
const AuthorizationMiddleware = require('../middlewares/authorization.middleware');

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
module.exports = userRouter;
