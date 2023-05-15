// Retrieve product details by
const errorHandler = require("../util/errorHandler");
const AppError = require("../util/appError");
const db = require("../util/connection");
const XLSX = require("xlsx");
const uploads = require("multer");
//getAll

async function getProductDetailsById(req, res) {
  // Implement logic to retrieve product details from a database or external API
  console.log("getProductDetailsById");
  try {
    if (!req.params.id) {
      throw new AppError("id must be present", 400);
    }
    const productId = req.params.id;
    const query = `SELECT * FROM products WHERE id = ${productId}`;
    const product = await db.query(query);
    res.json(product);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

// Retrieve products based on search string
async function getProductsBySearchString(req, res) {
  try {
    if (!req.params.searchString) {
      throw new AppError("searchString must be present", 400);
    }
    const searchString = req.params.searchString;
    const query = `SELECT * FROM products WHERE name LIKE '%${searchString}%' OR description LIKE '%${searchString}%'`;
    const product = await db.query(query);
    res.json(product);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

// Retrieve products by category
async function getProductsByCategory(req, res) {
  try {
    if (!req.params.category_id) {
      throw new AppError("body must be present", 400);
    }
    const categoryId = req.params.category_id;
    const query = `SELECT p.*
    FROM products AS p
    INNER JOIN categories AS c ON p.category_id = c.id
    WHERE c.id = ${categoryId}
  `;
    const product = await db.query(query);
    res.json(product);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

// Add a new product
async function addProduct(req, res) {
  try {
    if (!req.body) {
      throw new AppError("body must be present", 400);
    }
    const product = req.body;
    const category_id = product.category_id;
    console.log("add Product");
    let query = `INSERT INTO products (name, description, price, pack_size, category_id, product_image)
      SELECT '${product.name}',
      '${product.description}',
      ${product.price},
      '${product.packSize}',
      ${product.category_id},
      '${product.product_image}'
      FROM categories
      WHERE id = ${product.category_id};`;
    let response = await db.query(query);
    query = `INSERT INTO stock (product_id, total_stock, b2b_stock, b2c_stock, b2b_inward, b2c_inward, b2b_dump, b2c_dump, b2b_remaining, b2c_remaining)
    VALUES (${response.insertId}, ${product.total_stock}, ${product.b2b_stock}, ${product.b2c_stock}, 0, 0, 0, 0, 0, 0);
    `;
    response = await db.query(query);
    res.json(response);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

    const response = await db.query(query);
    res.json(response);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

// Update a product by id
async function updateProductById(req, res) {
  try {
    if (!req.params.id) {
      throw new AppError("product id must be present", 400);
    }
    const productId = req.params.id;
    const updatedProduct = req.body;
    let query = `
    UPDATE products
    SET name = '${updatedProduct.name}',
        description = '${updatedProduct.description}',
        price = ${updatedProduct.price},
        pack_size = '${updatedProduct.pack_size}',
        product_image='${updatedProduct.product_image}'
    WHERE id = ${productId}
  `;
    const product = await db.query(query);
    query = `update stock set totalstock=${updatedProduct.totalstock}, b2bstock=${updatedProduct.b2bstock}, b2cstock=${updatedProduct.b2bstock} where product_id = ${productId}`;
    res.json(product);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

// Update multiple products TODO: Add it as a transaction //FIX ME: do this later
async function updateBulkProducts(req, res) {
  try {
    const file = req.file;
    console.log(file);
    // const workbook = XLSX.read(file.data);
    // const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // const products = XLSX.utils.sheet_to_json(sheet);
    // console.log(products);
    res.json(req);
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "ERROR";
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
    errorHandler(err, res);
  }
}

module.exports = {
  getProductDetailsById,
  getProductsBySearchString,
  getProductsByCategory,
  addProduct,
  updateProductById,
  updateBulkProducts,
};
