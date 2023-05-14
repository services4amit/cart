var express = require("express");
var router = express.Router();
const {
  order,
  getOrderByCustomerId,
  getStockAvailabailityByProduct,
} = require("../service/orderService");
/* POST checkout */
router.post("/", order);

router.get("/order/:id", getOrderByCustomerId);

router.get("/stockavalabilitybyproduct", getStockAvailabailityByProduct);

module.exports = router;
