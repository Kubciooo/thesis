const express = require("express");
const morgan = require("morgan");
const ErrorController = require("./controllers/error.controller");
const AuthorizationMiddleware = require("./middlewares/authorization.middleware");
const categoryRouter = require("./routes/category.route");
const shopRouter = require("./routes/shop.route");
const productRouter = require("./routes/product.route");
const userRouter = require("./routes/user.route");
const shopPromotionRouter = require("./routes/shopPromotion.route");
const productPromotionRouter = require("./routes/productPromotion.route");

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/categories", AuthorizationMiddleware.authorize, categoryRouter);
app.use("/api/shops", AuthorizationMiddleware.authorize, shopRouter);
app.use("/api/products", AuthorizationMiddleware.authorize, productRouter);
app.use(
  "/api/promotions/shops",
  AuthorizationMiddleware.authorize,
  shopPromotionRouter
);
app.use(
  "/api/promotions/products",
  AuthorizationMiddleware.authorize,
  productPromotionRouter
);
app.use("/api/users", userRouter);

app.use(ErrorController.initialize);
module.exports = app;
