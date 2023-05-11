var express = require("express");
var router = express.Router();

/* POST addToCart. */
router.post("/addtocart", function (req, res, next) {
  res.render("index", { title: "Express" });
  //call addToCart(cartDetails);
});

/* GET  cart details by customer Id. */
router.get("/getByCustomerId", function (req, res, next) {
  res.render("index", { title: "Express" });
  //call getCartByCustomerId(customerId);
});

/* PUT  update cart details */
router.put("/updatecart", function (req, res, next) {
  res.render("index", { title: "Express" });
  //call updateCartDetails(cartDetails);
});
module.exports = router;
