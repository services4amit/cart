const db = require("../util/connection");
const AppError = require("../util/appError");
const errorHandler = require("../util/errorHandler");

const getCartByCustomerId = async (req, res, next) => {
  //db call to fetch the row by customerId;
  try {
    const customer_id = req.params.id;
    if (!customer_id) {
      throw new AppError("Missing customer ID", 400);
    }
    const query = `select c.product_id,c.product_quantity, ps.product_name,pd.description as product_description,pd.product_image,
    ps.id as pack_id,ps.mrp,ps.offered_price,ps.no_of_packs,ps.pack_size,ps.description as pack_description, ps.net_weight,
    ps.total_price*c.product_quantity as total_price,ps.discount from cart c left join pack_sizes ps on c.product_id=ps.product_id and 
    c.pack_id=ps.id left join products pd on pd.id=c.product_id where c.customer_id=${customer_id};`;
    console.log(query);
    let checkoutItems = await db.query(query);
    res.status(200).json({
      checkoutItems,
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
  return "id";
};

const addToCart = async (req, res, next) => {
  try {
    if (!req.body.customer_id || !req.body.order_details) {
      throw new AppError("customer_id and order_details must be present", 400);
    }
    const { customer_id, order_details } = req.body;
    const query = `INSERT INTO cart
    (
    customer_id,
    product_id,
    pack_id,
    product_quantity,
    created_by,
    updated_by)
    VALUES
    (${customer_id},${order_details.product_id},${order_details.pack_id},${
      order_details.product_quantity
    },${null},${null});

    select count(*) as count_of_products from cart where customer_id= ${customer_id};
      `;

    console.log(query);
    const product = await db.query(query);
    res.json(product[1][0]);
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
};

const updateCartDetails = async (req, res, next) => {
  try {
    const { customer_id, order_details } = req.body;
    const query = `update cart set pack_id=${order_details.pack_id}, product_quantity= ${order_details.product_quantity} where customer_id = ${customer_id} and product_id= ${order_details.product_id};
    select c.product_id,c.product_quantity, ps.product_name,pd.description as product_description,pd.product_image,
    ps.id as pack_id,ps.mrp,ps.offered_price,ps.no_of_packs,ps.pack_size,ps.description as pack_description, ps.net_weight,
    ps.total_price*c.product_quantity as total_price,ps.discount from cart c left join pack_sizes ps on c.product_id=ps.product_id and 
    c.pack_id=ps.id left join products pd on pd.id=c.product_id where c.customer_id=${customer_id};
    `;
    console.log(query);
    const result = await db.query(query);
    console.log(result);
    if (result[0].message.includes("Rows matched: 0")) {
      throw new Error("PRODUCT ID OR CUSTOMER ID IS NOT PRESENT");
    }
    res.status(200).json(result[1]);
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
};

const getStockAvailabailityByCustomer = async (req, res, next) => {
  //db call to update the row
  const customer_id = req.params.customer_id;
  console.log("getSTock");
  try {
    if (!customer_id) {
      throw new AppError("Invalid customer Id", 400);
    }

    console.log(customer_id);
    // let order_product_ids=[];
    // let avail_query = ` select product_id from stock where `;
    // order_details.forEach((element, index) => {
    //   let str = "";
    //   if (index == 0) {
    //     str = `(product_id = ${element.product_id} and b2b_stock>=${element.product_quantity}*${element.pack_details.size} )`;
    //   } else {
    //     str = ` OR (product_id = ${element.product_id} and b2b_stock>=${element.product_quantity}*${element.pack_details.size} )`;
    //   }
    //   avail_query += str;
    // });
    const avail_query = `select cart.*, 
    EXISTS(SELECT cart.product_id FROM stock WHERE cart.product_id = stock.product_id AND b2b_stock >= cart.product_quantity*cart.net_weight )as available 
    from(select c.product_id,c.product_quantity, ps.product_name,ps.id as pack_id,ps.mrp,ps.offered_price,ps.no_of_packs,ps.pack_size,ps.description,
    ps.net_weight,ps.total_price*c.product_quantity as total_price,ps.discount from cart c left join
    pack_sizes ps on c.product_id=ps.product_id and c.pack_id=ps.id left join stock s on s.product_id=c.product_id where c.customer_id=${customer_id} )cart;`;
    console.log(avail_query);

    // let query = `select product_id from stock where (product_id =2 and b2b_stock>=20) OR (product_id =56 and b2b_stock>=10)`;
    // // const query = `select product_id from stock where product_id in (${productid.slice(
    // //   1,
    // //   productid.length - 1
    // // )})`;
    const resultset = await db.query(avail_query);
    res.json(resultset);
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
};

module.exports = {
  addToCart,
  updateCartDetails,
  getCartByCustomerId,
  getStockAvailabailityByCustomer,
};
