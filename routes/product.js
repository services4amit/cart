/*
/getAll
/productdetails/:id
/getbysearch/:{search string}
/getproductbycategory
/Addproduct
/updateproduct/:id
/updatebulkproduct
*/

var express = require("express");
const multer=require("multer")
const {
  getProductDetailsById,
  getProductsByCategory,
  getProductsBySearchString,
  addProduct,
  updateProductById,
  updateBulkProducts,
  getAll,
} = require("../service/productService");
var router = express.Router();
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

/* GET users listing. */
router.get("/getAll", function (req, res, next) {
  res.send("respond with a resource");
});

// GET route for /productdetails/:id
router.get("/productdetails/:id", getProductDetailsById);

// GET route for /getbysearch/:{search string}
router.get("/getbysearch/:searchString", getProductsBySearchString);

// GET route for /getproductbycategory
router.get("/getproductbycategory/:category_id", getProductsByCategory);

// POST route for /Addproduct
router.post("/Addproduct", addProduct);

// PUT route for /updateproduct/:id
router.put("/updateproduct/:id", updateProductById);

// PUT route for /updatebulkproduct
router.patch("/updatebulkproduct", upload.single("file"), updateBulkProducts);

module.exports = router;
