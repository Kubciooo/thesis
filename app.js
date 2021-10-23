const express = require("express");
const morgan = require("morgan");
const ErrorController = require("./controllers/error.controller");
const categoryRouter = require("./routes/category.route");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/categories", categoryRouter);

app.use(ErrorController.initialize);
module.exports = app;
