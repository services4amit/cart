var createError = require("http-errors");
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
require("dotenv").config();
var cartRouter = require("./routes/cart");
var checkoutRouter = require("./routes/checkout");
var productsRouter = require("./routes/product");
var orderRouter = require("./routes/order");

var app = express();
app.use(bodyParser.json());
app.use("/product", productsRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/order", orderRouter);
const port = 3100;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


module.exports = app;
