const db = require("../util/connection");
const AppError = require("../util/appError");
const errorHandler = require("../util/errorHandler");

const getOrderByCustomerId = async (req, res, next) => {
  //db call to fetch the row by customerId;
  try {
    const customer_id = req.params.id;
    const query = `select * from orders
   where customer_id=${customer_id}`;
    const response = await db.query(query);
    res.json(response);
  } catch (err) {
    // console.log(err);
    res.json(err);
  }
  return;
};

const order = async (req, res, next) => {
  try {
    // if (!req.params.id) {
    //   throw new AppError("id must be present", 400);
    // }
    //req.body = {customer id-2, product id-3,4}}

    const { customer_id, order_details, payment_type } = req.body;
    const order_details_string = "'" + JSON.stringify(order_details) + "'";
    //check availability
    //constant for now
    //update cart

    //Case1 where everything is assumed available since the stock table isn't designed yet
    const update_cart = `update cart set active=0 where customer_id =${customer_id} and active=1;`; //for now setting it to inactive to test
    // CASE 2 when something is unavailable

    //create order
    const order_query = `INSERT INTO orders
    (
    customer_id,
    details)
    VALUES
    (${customer_id},${order_details_string});
   `;
    const order = await db.query(order_query);
    console.log("order ", order.insertId);

    let transaction_type = payment_type === "COD" ? "COD" : null;
    //create trans
    const trans_query = `INSERT INTO transactions
    (
      transaction_status,
      transaction_type,
      order_id
      )
    VALUES
    ("INITIATED",${transaction_type},${order.insertId})
      `;
    const trans = await db.query(trans_query);
    console.log("trans ", trans.insertId);

    //create order status
    const status_query = `INSERT INTO status
    (
    status_type,
    orderId)
    VALUES
    ("INITIATED",${order.insertId})
      `;
    const status = await db.query(status_query);
    console.log("status ", status.insertId);

    //update orders table
    const update_order_query = `UPDATE  orders
    SET 
    status_id = ${status.insertId},
    transaction_id = ${trans.insertId}
  `;

    const update_order = await db.query(update_order_query);
    console.log("update_order ", update_order);
    res.json({ order_id: order.insertId });
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

const getStockAvailabailityByProduct = async (req, res, next) => {
  //db call to update the row
  try {
    const { productid } = req.body;
    const query = `select product_id from stock where product_id in (${productid.slice(
      1,
      productid.length - 1
    )})`;
    const resultset = await db.query(query);
    let validProducts = [];
    resultset.map((row) => {
      validProducts.push(row.product_id);
    });
    res.json({ available_products: validProducts });
  } catch (err) {
    res.json(err);
  }
};

module.exports = {
  order,
  getOrderByCustomerId,
  getStockAvailabailityByProduct,
};
