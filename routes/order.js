var express = require("express");
var router = express.Router();
const { order } = require("../service/orderService");
/* POST checkout */
router.post("/", order);

module.exports = router;
