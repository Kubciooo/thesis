const express = require("express");
const morgan = require("morgan");
const ErrorController = require("./controllers/error.controller");
const AuthorizationMiddleware = require('./middlewares/authorization.middleware');
const categoryRouter = require("./routes/category.route");
const shopRouter = require("./routes/shop.route");
const productRouter = require("./routes/product.route");
const userRouter = require("./routes/user.route");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/categories", AuthorizationMiddleware.authorize, categoryRouter);
app.use("/api/shops", AuthorizationMiddleware.authorize, shopRouter);
app.use("/api/products", AuthorizationMiddleware.authorize, productRouter);
app.use("/api/users", userRouter);

app.use(ErrorController.initialize);
module.exports = app;
