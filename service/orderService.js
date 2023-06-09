const db = require("../util/connection");
const AppError = require("../util/appError");
const errorHandler = require("../util/errorHandler");

const getOrderByCustomerId = async (req, res, next) => {
  //db call to fetch the row by customerId;
  try {
    console.log(req.path.split("/").filter((part) => part !== ""));
    let path = req.path.split("/").filter((part) => part !== "")[0];
    const customer_id = req.params.id;
    if (!customer_id) {
      throw new AppError("Missing customer ID", 400);
    }
    let query = "";
    if (path == "past") {
      query = `select o.*,s.status_type from orders o join status s on o.order_id=s.orderId
      where customer_id=${customer_id} and o.status_id in (select status_id from status where status_type='DELIVERED');`;
    } else {
      query = `select o.*,s.status_type from orders o join status s on o.order_id=s.orderId
      where customer_id=${customer_id} and o.status_id in (select status_id from status where status_type!='DELIVERED');`;
    }

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

    const expectedFields = ["customer_id", "order_details", "payment_type"];

    const missingFields = expectedFields.filter((field) => !order[field]);

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(
        ", "
      )}`;
      throw new AppError(errorMessage, 400);
    }
    const order_details_string = "'" + JSON.stringify(order_details) + "'";
    let total_price = order_details.reduce((sum, cur) => {
      sum += cur.price;
      return sum;
    }, 0);

    // //update cart
    // const update_cart = `update cart set active=0 where customer_id =${customer_id} and active=1;`; //for now setting it to inactive to test
    // const update_cart_resp = await db.query(update_cart);
    //create order
    const order_query = `INSERT INTO orders
    (
    customer_id,
    details,total_price)
    VALUES
    (${customer_id},${order_details_string},${total_price});
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
    ("INITIATED",
    '${transaction_type}',${order.insertId})
      `;
    console.log(trans_query);
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
    transaction_id = ${trans.insertId} where order_id=${order.insertId}
  `;

    const update_order = await db.query(update_order_query);
    console.log("update_order ", update_order);
    res.status(200).json({
      status: 200,
      message: "Order created successfully",
      order_id: order.insertId,
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
};

module.exports = {
  order,
  getOrderByCustomerId,
};
