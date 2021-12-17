const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const ErrorController = require('./controllers/error.controller');
const AuthorizationMiddleware = require('./middlewares/authorization.middleware');
const categoryRouter = require('./routes/category.route');
const shopRouter = require('./routes/shop.route');
const productRouter = require('./routes/product.route');
const userRouter = require('./routes/user.route');
const shopPromotionRouter = require('./routes/shopPromotion.route');
const productPromotionRouter = require('./routes/productPromotion.route');
const foldersRoute = require('./routes/folders.route');

/**
 * Tworzenie aplikacji
 */
const app = express();

/**
 * Aplikacja używa express.json() do obsługi żądań typu application/json
 */
app.use(express.json());

/**
 * aplikacja używa cors() w celu obsługi żądań z weba (w razie potrzeby jest to możliwe w przyszłości)
 */
app.use(cors());

/**
 * aplikacja używa morgan() do logowania żądań w konsoli przy rozwoju aplikacji
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * aplikacja używa AuthorizationMiddleware() w celu obsługi autoryzacji
 * Dodatkowo tutaj są ustawione wszystkie ścieżki w aplikacji
 */
app.use('/api/categories', AuthorizationMiddleware.authorize, categoryRouter);
app.use('/api/shops', AuthorizationMiddleware.authorize, shopRouter);
app.use('/api/products', AuthorizationMiddleware.authorize, productRouter);
app.use(
  '/api/promotions/shops',
  AuthorizationMiddleware.authorize,
  shopPromotionRouter
);
app.use(
  '/api/promotions/products',
  AuthorizationMiddleware.authorize,
  productPromotionRouter
);
app.use('/api/users', userRouter);

app.use('/api/folders', AuthorizationMiddleware.authorize, foldersRoute);

/**
 * aplikacja używa ErrorController() w celu obsługi błędów
 */
app.use(ErrorController.initialize);
module.exports = app;
