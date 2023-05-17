// Retrieve product details by
const errorHandler = require("../util/errorHandler");
const AppError = require("../util/appError");
const db = require("../util/connection");
const xlsx = require("xlsx");

//getAll
async function getAll(req, res, next) {
  let query = `SELECT category_id, GROUP_CONCAT(CONCAT('{name:"', name, '", price:"',price,'",category_id:"',category_id,'",category_name:"',category_name,'",product_image:"',product_image, '"}')) list FROM 
  (select s.id,s.name,s.price,s.description,s.product_image,cat.id as category_id,cat.name as category_name from(select * from(select *,RANK() over 
  (partition by category_id order by id desc)r from products)sq where sq.r<=2)s join categories cat on s.category_id=cat.id)res 
  GROUP BY category_id;`;
  const resultList = await db.query(query);
  // console.log(resultList);
  const result = [];
  const regex = /,(?![^{]*\})/g;
  resultList.map((row) => {
    const objStrings = row.list.split(regex);
    let obj1 = eval("(" + objStrings[0] + ")");
    let obj2 = eval("(" + objStrings[1] + ")");

    let arr = [];
    arr.push(obj1);
    arr.push(obj2);

    result.push({
      category_id: row.category_id,
      list: arr,
    });
  });
  query = ` select s.id,s.name,s.price,s.product_image,cat.id as category_id,cat.name as category_name from(select * from(select *,RANK() over 
  (partition by category_id order by id desc)r from products)sq where sq.r>2)s join categories cat on s.category_id=cat.id;`;
  const response = await db.query(query);
  res.json({
    latest: result,
    restProducts: response,
  });
}

async function getProductDetailsById(req, res) {
  console.log("getProductDetailsById");
  try {
    if (!req.params.id) {
      throw new AppError("id must be present", 400);
    }
    const productId = req.params.id;
    let query = `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE p.id = ${productId}`;

    console.log(query);
    let product = await db.query(query);
    query = `SELECT c.id as pack_id,c.size,c.description  FROM products p join pack_sizes c on p.id=c.product_id WHERE p.id = ${productId}`;
    let packs = await db.query(query);
    console.log(packs);
    if (product.length > 0) {
      product[0]["pack_sizes"] = packs;
    }
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
    const query = `SELECT p.*,c.name as category_name
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
    if (
      !product.name ||
      !product.category_id ||
      !product.product_image ||
      !product.total_stock ||
      !product.b2b_stock ||
      !product.b2c_stock
    ) {
      throw new AppError("Missing required fields", 400);
    }

    if (isNaN(product.price) || product.price <= 0) {
      throw new AppError("Invalid price value", 400);
    }

    if (
      isNaN(product.total_stock) ||
      isNaN(product.b2b_stock) ||
      isNaN(product.b2c_stock)
    ) {
      throw new AppError("Stock values must be numbers", 400);
    }

    if (product.total_stock != product.b2b_stock + product.b2c_stock) {
      throw new AppError("Total stock is not proper");
    }
    const category_id = product.category_id;
    const calculatedTotalStock = product.b2b_stock + product.b2c_stock;

    if (product.total_stock !== calculatedTotalStock) {
      throw new AppError(
        "Total stock is not equal to the sum of b2b and b2c stock"
      );
    }
    console.log("add Product");
    const description_string = JSON.stringify(product.description);
    let query = `INSERT INTO products (name, description, price, category_id, product_image)
      SELECT '${product.name}',
      '${description_string}',
      ${product.price},
      ${product.category_id},
      '${product.product_image}'
      FROM categories
      WHERE id = ${product.category_id};`;
    console.log("add Product", query);
    let response = await db.query(query);
    if (response.insertId === 0) {
      throw new Error("Invalid category id");
    }
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

// Update a product by id
async function updateProductById(req, res) {
  try {
    if (!req.params.id) {
      throw new AppError("product id must be present", 400);
    }
    const productId = req.params.id;
    const updatedProduct = req.body;
    if (
      !updatedProduct.name ||
      !updatedProduct.description ||
      !updatedProduct.price ||
      !updatedProduct.product_image ||
      !updatedProduct.total_stock ||
      !updatedProduct.b2b_stock ||
      !updatedProduct.b2c_stock
    ) {
      throw new AppError("Missing required fields", 400);
    }

    if (isNaN(updatedProduct.price) || updatedProduct.price <= 0) {
      throw new AppError("Invalid price value", 400);
    }

    if (
      isNaN(updatedProduct.total_stock) ||
      isNaN(updatedProduct.b2b_stock) ||
      isNaN(updatedProduct.b2c_stock)
    ) {
      throw new AppError("Stock values must be numbers", 400);
    }
    let query = `
    UPDATE products
    SET name = '${updatedProduct.name}',
        description = '${JSON.stringify(updatedProduct.description)}',
        price = ${updatedProduct.price},
        product_image='${updatedProduct.product_image}'
    WHERE id = ${productId}
  `;
    console.log(query);
    let product = await db.query(query);
    console.log("update");
    query = `update stock set total_stock=${updatedProduct.total_stock}, b2b_stock=${updatedProduct.b2b_stock}, b2c_stock=${updatedProduct.b2c_stock} where product_id = ${productId}`;
    console.log(query);
    product = await db.query(query);
    console.log("stock");
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
    console.log("fdf");
    if (req.file) {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      let str = "";
      jsonData.forEach((data) => {
        if (!data[0] || !data[1]) {
          throw new AppError("Invalid data in the file", 400);
        }
        const productId = parseInt(data[0]);
        const price = parseFloat(data[1]);

        if (isNaN(productId) || isNaN(price) || price <= 0) {
          throw new AppError("Invalid data format in the file", 400);
        }
        str += `update \`products\` set \`price\`=${data[1]} where \`id\`=${data[0]};`;
      });
      console.log(str);
      const response = await db.query(str);
      console.log(response);
      res.status(200).json({ message: "File uploaded successfully" });
    } else {
      // No file was uploaded
      res.status(400).json({ message: "No file uploaded" });
    }
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
  getAll,
  getProductDetailsById,
  getProductsBySearchString,
  getProductsByCategory,
  addProduct,
  updateProductById,
  updateBulkProducts,
};

