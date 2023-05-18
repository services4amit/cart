// Retrieve product details by
const errorHandler = require("../util/errorHandler");
const AppError = require("../util/appError");
const db = require("../util/connection");
const xlsx = require("xlsx");
const path = require("path");

//getAll
async function getAll(req, res, next) {
  let query = `SELECT category_id, GROUP_CONCAT(CONCAT('{name:"', name,'",category_id:"',category_id,'",category_name:"',category_name,'",product_image:"',product_image, '"}')) list FROM 
  (select s.id,s.name,s.description,s.product_image,cat.id as category_id,cat.name as category_name from(select * from(select *,RANK() over 
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
  // query = ` select s.id,s.name,s.product_image,cat.id as category_id,cat.name as category_name from(select * from(select *,RANK() over
  // (partition by category_id order by id desc)r from products)sq where sq.r>2)s join categories cat on s.category_id=cat.id;`;

  query = `SELECT prod.*, JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', pass.product_id,
      'product_name', pass.product_name,
      'mrp', pass.mrp,
      'offered_price', pass.offered_price,
      'no_of_packs', pass.no_of_packs,
      'pack_size', pass.pack_size,
      'description', pass.description
    )
  ) AS pack_sizes_json
  FROM (
    SELECT s.id, s.name, s.product_image, cat.id AS category_id, cat.name AS category_name
    FROM (
      SELECT *
      FROM (
        SELECT *, RANK() OVER (PARTITION BY category_id ORDER BY id DESC) r
        FROM products
      ) sq
      WHERE sq.r > 2
    ) s
    JOIN categories cat ON s.category_id = cat.id
  ) prod
  LEFT JOIN pack_sizes pass ON prod.id = pass.product_id
  GROUP BY prod.id, prod.name, prod.product_image, prod.category_id, prod.category_name  order by prod.id desc;`;
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
    const expectedFields = [
      "name",
      "category_id",
      "product_image",
      "total_stock",
      "b2b_stock",
      "b2c_stock",
    ];

    const missingFields = expectedFields.filter((field) => !product[field]);

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(
        ", "
      )}`;
      throw new AppError(errorMessage, 400);
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
    let query = `INSERT INTO products (name, description, category_id, product_image)
      SELECT '${product.name}',
      '${description_string}',
      ${product.category_id},
      '${product.product_image}'
      FROM categories
      WHERE id = ${product.category_id};`;
    console.log("add Product", query);
    let response = await db.query(query);
    console.log("prod", response);
    if (response.insertId === 0) {
      throw new Error("Invalid category id");
    }
    query = `INSERT INTO stock (product_id, total_stock, b2b_stock, b2c_stock, b2b_inward, b2c_inward, b2b_dump, b2c_dump, b2b_remaining, b2c_remaining)
    VALUES (${response.insertId}, ${product.total_stock}, ${product.b2b_stock}, ${product.b2c_stock}, 0, 0, 0, 0, 0, 0);
    `;
    stock_response = await db.query(query);

    let pack_sizes_sql =
      "INSERT INTO pack_sizes (product_id, product_name, mrp, offered_price, no_of_packs, pack_size, description) VALUES ?";
    let data = product.pack_sizes.map((obj) => {
      return {
        product_id: response.insertId,
        product_name: product.name,
        mrp: obj.mrp,
        offered_price: obj.offered_price,
        no_of_packs: obj.no_of_packs,
        pack_size: obj.pack_size,
        description: obj.description,
      };
    });

    console.log(data);
    console.log("values", [data.map(Object.values)]);
    let pack_sizes_sql_response = await db.query(pack_sizes_sql, [
      data.map(Object.values),
    ]);

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
    const expectedFields = [
      "name",
      "description",
      "price",
      "product_image",
      "total_stock",
      "b2b_stock",
      "b2c_stock",
    ];

    const missingFields = expectedFields.filter(
      (field) => !updatedProduct[field]
    );

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(
        ", "
      )}`;
      throw new AppError(errorMessage, 400);
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
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 0 });
      console.log(jsonData);
      let str = "";
      jsonData.forEach((data) => {
        if (!data.id || !data.mrp || !data.offered_price) {
          throw new AppError("Invalid data in the file", 400);
        }
        const { id, offered_price, mrp } = data;

        console.log(id);
        if (
          isNaN(id) ||
          isNaN(offered_price) ||
          offered_price <= 0 ||
          isNaN(mrp) ||
          mrp <= 0
        ) {
          throw new AppError("Invalid data format in the file", 400);
        }
        str += `update \`pack_sizes\` set \`offered_price\`=${offered_price},mrp=${data.mrp} where \`id\`=${id};`;
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
async function downloadFileForBulkUpload(req, res, next) {
  try {
    const query = `select ps.id ,ps.product_id, ps.pack_size,ps.product_name, ps.mrp,ps.offered_price  from pack_sizes ps join products p on p.id = ps.product_id where p.category_id =${req.params.category_id};
    `;
    const result = await db.query(query);
    const rows = result.map((row) => ({ ...row }));
    const workbook = xlsx.utils.book_new(); //creates a new excel sheet with a new book
    const worksheet = xlsx.utils.json_to_sheet(rows); //rows to table
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const filename = "query_result.xlsx";
    xlsx.writeFile(workbook, filename);
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=query_result.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const absolutePath = path.resolve(filename);
    res.sendFile(absolutePath);
  } catch (err) {
    console.error(err);
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
  downloadFileForBulkUpload,
};
