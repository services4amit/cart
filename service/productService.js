// Retrieve product details by
const errorHandler = require("../util/errorHandler");
const AppError = require("../util/appError");
const db = require("../util/connection");
const xlsx = require("xlsx");
const path = require("path");
const IsFirstReq = require("../util/isFirstReq");
const {
  PageSchema,
  SearchStringSchema,
  IdSchema,
  AddproductSchema,
  UpdateProductSchema,
} = require("../JoiValidations/joiSchemas");

function product_packs_create(arr) {
  const regex = /,(?![^{]*\})/g;

  return arr.reduce((sum, row) => {
    const objStrings = row.pack_sizes.split(regex);
    let arr = [];
    objStrings.forEach((element) => {
      let modified = element.replace(/[\[\]]/g, "");

      let obj = eval("(" + modified + ")");
      arr.push(obj);
    });
    sum.push({
      ...row,
      pack_sizes: arr,
    });
    return sum;
  }, []);
}
//getAll
async function getAll(req, res, next) {
  // let query = `SELECT category_id, GROUP_CONCAT(CONCAT('{name:"', name,'",category_id:"',category_id,'",category_name:"',category_name,'",product_image:"',product_image, '"}')) list FROM
  // (select s.id,s.name,s.description,s.product_image,cat.id as category_id,cat.name as category_name from(select * from(select *,RANK() over
  // (partition by category_id order by id desc)r from products)sq where sq.r<=2)s join categories cat on s.category_id=cat.id)res
  // GROUP BY category_id;`;

  const { error, page } = PageSchema.validate(req.query.page);
  if (error) {
    console.error(error);
    throw new Error(error);
  }
  const isFirstReq = IsFirstReq(page);

  let limit = 6;
  let offset = 0;
  if (!isFirstReq) {
    limit = 15;
    offset = 6 + limit * (parseInt(req.query.page) - 1);
    console.log("inside not first req");
    console.log(limit, "limit", offset, "offset");
  }

  let query = `SET SESSION sql_mode = "";`;
  const SESSION = await db.query(query);
  query = `SET SESSION group_concat_max_len = 18446744073709551615; `;
  await db.query(query);
  console.log("SESSION", SESSION);
  query = `SELECT prod.*, JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', pass.product_id,
      'product_name', pass.product_name,
      'mrp', pass.mrp,
      'offered_price', pass.offered_price,
      'no_of_packs', pass.no_of_packs,
      'pack_size', pass.pack_size,
      'description', pass.description,
      'net_weight',pass.net_weight,
      'total_sale_price',pass.total_sale_price,
      'total_mrp',pass.total_mrp,
      'discount',pass.discount,
      'available',(
        SELECT EXISTS(SELECT product_id FROM stock WHERE product_id = pass.product_id AND b2b_stock >= pass.net_weight) 
    )
    )
  ) AS pack_sizes
  FROM (
    SELECT s.id, s.name, s.description, s.product_image, cat.id AS category_id, cat.name AS category_name
    FROM (
      SELECT *
      FROM (
        SELECT *, RANK() OVER (PARTITION BY category_id ORDER BY id DESC) r
        FROM products
      ) sq
      WHERE sq.r <= 3 LIMIT 9 OFFSET 0
    ) s
    JOIN categories cat ON s.category_id = cat.id
  ) prod
  LEFT JOIN pack_sizes pass ON prod.id = pass.product_id
  GROUP BY prod.id, prod.name, prod.description, prod.product_image, prod.category_id, prod.category_name order by prod.id desc`;
  const resultList = await db.query(query);

  query = `SELECT prod.*, JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', pass.product_id,
      'product_name', pass.product_name,
      'mrp', pass.mrp,
      'offered_price', pass.offered_price,
      'no_of_packs', pass.no_of_packs,
      'pack_size', pass.pack_size,
      'description', pass.description,
      'net_weight',pass.net_weight,
      'total_sale_price',pass.total_sale_price,
      'total_mrp',pass.total_mrp,
      'discount',pass.discount
    )
  ) AS pack_sizes
  FROM (
    SELECT s.id, s.name, s.product_image, cat.id AS category_id, cat.name AS category_name
    FROM (
      SELECT *
      FROM (
        SELECT *, RANK() OVER (PARTITION BY category_id ORDER BY id DESC) r
        FROM products
      ) sq
      WHERE sq.r > 3 LIMIT ${limit} OFFSET ${offset}
    ) s
    JOIN categories cat ON s.category_id = cat.id
  ) prod
  LEFT JOIN pack_sizes pass ON prod.id = pass.product_id
  GROUP BY prod.id, prod.name, prod.product_image, prod.category_id, prod.category_name  order by prod.id desc;`;
  const response = await db.query(query);
  const result = {
    restProducts: product_packs_create(response),
  };
  if (isFirstReq) {
    result["latest"] = product_packs_create(resultList);
  }
  res.status(200).json(result);
}

async function getProductDetailsById(req, res) {
  console.log("getProductDetailsById");
  try {
    const { err, productId } = IdSchema.validate(req.params.id);
    if (err) {
      throw new AppError(err, 400);
    }
    let query = `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE p.id = ${productId}`;

    console.log(query);
    let product = await db.query(query);
    query = `SELECT c.*, 
    case 
    when (SELECT EXISTS(SELECT product_id FROM stock WHERE product_id = c.product_id AND b2b_stock >= c.net_weight))
    then 'true'
    else 'false'
    end 
    as available  FROM products p join pack_sizes c on p.id=c.product_id WHERE p.id = ${productId}`;
    let packs = await db.query(query);
    console.log(packs);
    if (product.length > 0) {
      product[0]["pack_sizes"] = packs;
    }
    res.status(200).json({
      product,
    });
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
    const limit = 15;
    let offset = 0;
    const { err, page } = PageSchema.validate(req.query.page);
    if (err) {
      throw new AppError(err, 400);
    }
    offset = IsFirstReq(page) ? 0 : limit * parseInt(page);
    console.log("offset", offset);
    const { error, searchString } = SearchStringSchema.validate(
      req.params.searchString
    );
    if (error) {
      throw new AppError(error, 400);
    }
    const query = `SELECT prod.id, prod.name, prod.description, prod.product_image, prod.category_id, JSON_ARRAYAGG(
      JSON_OBJECT(
        'product_id', pass.product_id,
        'product_name', pass.product_name,
        'mrp', pass.mrp,
        'offered_price', pass.offered_price,
        'no_of_packs', pass.no_of_packs,
        'pack_size', pass.pack_size,
        'description', pass.description,
        'available', (
          SELECT EXISTS(SELECT product_id FROM stock WHERE product_id = pass.product_id AND b2b_stock >= pass.net_weight) 
      )
      )
    ) AS pack_sizes
    FROM (
     SELECT * FROM products pd  WHERE pd.name LIKE '%${searchString}%'
       ) prod
    LEFT JOIN pack_sizes pass ON prod.id = pass.product_id GROUP BY prod.id limit ${limit} offset ${offset};`;
    console.log(query);
    const product = await db.query(query);
    res.json(product_packs_create(product));
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
    const limit = 15;
    let offset = 0;
    const { err, page } = PageSchema.validate(req.query.page);
    if (err) {
      throw new AppError(err);
    }
    offset = IsFirstReq(page) ? 0 : limit * parseInt(page);
    const { error, categoryId } = IdSchema.validate(req.params.category_id);
    if (error) {
      throw new AppError(error, 400);
    }
    const query = ` SELECT prod.id, prod.name, prod.product_image, prod.category_id, prod.category_name, JSON_ARRAYAGG(
      JSON_OBJECT(
        'product_id', pass.product_id,
        'product_name', pass.product_name,
        'mrp', pass.mrp,
        'offered_price', pass.offered_price,
        'no_of_packs', pass.no_of_packs,
        'pack_size', pass.pack_size,
        'available',(
          SELECT EXISTS(SELECT product_id FROM stock WHERE product_id = pass.product_id AND b2b_stock >= pass.net_weight) 
        )
      )
    ) AS pack_sizes FROM (  SELECT p.*,c.name as category_name
    FROM products AS p
    INNER JOIN categories AS c ON p.category_id = c.id
    WHERE c.id = ${categoryId}) prod LEFT JOIN pack_sizes pass ON prod.id = pass.product_id GROUP BY prod.id limit ${limit} offset ${offset}
  `;
    const product = await db.query(query);
    res.json(product_packs_create(product));
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
    const { error, product } = AddproductSchema.validate(req.body);
    if (error) {
      throw new AppError(error, 400);
    }

    if (product.total_stock != product.b2b_stock + product.b2c_stock) {
      throw new AppError("Total stock is not proper");
    }
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

    res.status(200).json({
      status: 200,
      message: "product added successfully",
    });
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
    const { error, productId } = IdSchema.validate(req.params.id);
    if (error) {
      console.log(error);
      throw new AppError(error, 400);
    }
    const { err, updatedProduct } = UpdateProductSchema.validate(req.body);
    if (err) {
      throw new AppError(err, 400);
    }
    let query = `
    UPDATE products
    SET description = '${JSON.stringify(updatedProduct.description)}',
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
    res
      .status(200)
      .json({ status: 200, message: "product updated successfully" });
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
        if (!data.id || !data.mrp || !data.offered_price || !data.no_of_packs) {
          throw new AppError("Invalid data in the file", 400);
        }
        const { id, offered_price, mrp, pack_size, no_of_packs } = data;

        console.log(id);
        if (
          isNaN(id) ||
          isNaN(offered_price) ||
          offered_price <= 0 ||
          isNaN(mrp) ||
          mrp <= 0 ||
          isNaN(pack_size) ||
          isNaN(no_of_packs)
        ) {
          throw new AppError("Invalid data format in the file", 400);
        }
        str += `update \`pack_sizes\` set \`offered_price\`=${offered_price},mrp=${mrp},no_of_packs=${no_of_packs},pack_size=${pack_size} where \`id\`=${id};`;
      });
      console.log(str);
      const response = await db.query(str);
      console.log(response);
      res
        .status(200)
        .json({ status: 200, message: "File uploaded successfully" });
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
    const query = `select ps.id ,ps.product_id, ps.pack_size,ps.no_of_packs,ps.product_name, ps.mrp,ps.offered_price  from pack_sizes ps join products p on p.id = ps.product_id where p.category_id =${req.params.category_id};
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
