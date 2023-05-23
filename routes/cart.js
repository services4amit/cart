var express = require("express");
const {
  getCartByCustomerId,
  updateCartDetails,
  addToCart,
  getStockAvailabailityByCustomer,
} = require("../service/cartService");
var router = express.Router();

/* POST addToCart. */
router.post("/addtocart", addToCart);

/* GET  cart details by customer Id. */
router.get("/getByCustomerId/:id", getCartByCustomerId);

/* PUT  update cart details */
router.put("/updatecart", updateCartDetails);

router.get(
  "/stockavalabilitybycustomer/:customer_id",
  getStockAvailabailityByCustomer
);

module.exports = router;
