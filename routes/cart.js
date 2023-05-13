var express = require("express");
const { getCartByCustomerId, getCheckoutItem, updateCartDetails } = require("../service/cartService");
var router = express.Router();

/* POST addToCart. */
router.post("/addtocart", function (req, res, next) {
  res.render("index", { title: "Express" });
  //call addToCart(cartDetails);
});

/* GET  cart details by customer Id. */
router.get("/getByCustomerId/:id",  getCartByCustomerId);

/* PUT  update cart details */
router.put("/updatecart",updateCartDetails);


/*GET checkout item */
router.get("/getcheckoutitem", getCheckoutItem);

module.exports = router;
