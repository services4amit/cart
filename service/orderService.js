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

    const { customer_id, order_details, payment_type } = req.body;
    const order_details_string = "'" + JSON.stringify(order_details) + "'";
    //check availability
    //update cart

    //create order
    const order_query = `INSERT INTO orders
    (
    customer_id,
    details)
    VALUES
    (${customer_id},${order_details_string})
      `;
    const order = await db.query(order_query);
    console.log("order ", order);

    //create trans
    const trans_query = `INSERT INTO transactions
    (
      transaction_status,
      transaction_type,
      order_id
      )
    VALUES
    ("STARTTED","COD",1)
      `;
    const trans = await db.query(trans_query);
    console.log("trans ", trans);

    //create order status
    const status_query = `INSERT INTO status
    (
    status_type,
    orderId)
    VALUES
    ("ORDERED",1)
      `;
    const status = await db.query(status_query);
    console.log("status ", status);

    //update orders table
    const update_order_query = `UPDATE  orders
    SET 
    status_id = 11,
    transaction_id = 1
  `;

    const update_order = await db.query(update_order_query);
    console.log("update_order ", update_order);
    res.json({});
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

// const updateCartDetails = async (cartDetails) => {
//   //db call to update the row
//   try {
//     //await db.query()
//   } catch (err) {
//     //console.log(err);
//   }
//   return "id";
// };

module.exports = {
  order,
  getOrderByCustomerId,
};
