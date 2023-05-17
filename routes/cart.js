var express = require("express");
const {
  getCartByCustomerId,
  getCheckoutItem,
  updateCartDetails,
  addToCart,
} = require("../service/cartService");
var router = express.Router();

/* POST addToCart. */
router.post("/addtocart", addToCart);

/* GET  cart details by customer Id. */
router.get("/getByCustomerId/:id", getCartByCustomerId);

/* PUT  update cart details */
// router.put("/updatecart",updateCartDetails);

/*GET checkout item */
router.get("/getcheckoutitem/:id", getCheckoutItem);
module.exports = router;
