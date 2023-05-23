var express = require("express");
var router = express.Router();
const {
  order,
  getOrderByCustomerId,
  getStockAvailabailityByProduct,
} = require("../service/orderService");
/* POST checkout */
router.post("/", order);

router.get("/past/:id", getOrderByCustomerId);
router.get("/active/:id", getOrderByCustomerId);



module.exports = router;
