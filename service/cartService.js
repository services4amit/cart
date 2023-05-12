const db = require("../util/connection");
const AppError = require("../util/appError");
const errorHandler = require("../util/errorHandler");

const getCartByCustomerId = async (req, res, next) => {
  //db call to fetch the row by customerId;
  try {
    const customer_id = req.params.id;
    const query = `select * from cart
   where customer_id=${customer_id} and active = 1`;
    console.log(query);
    const response = await db.query(query);
    res.json(response);
  } catch (err) {
    //console.log(err);
  }
  return "id";
};

const addToCart = async (req, res, next) => {
  try {
    // if (!req.params.id) {
    //   throw new AppError("id must be present", 400);
    // }

    const { customer_id, order_details } = req.body;
    //update other rows to active false

    const update_query = `UPDATE cart
    SET active = 0
    WHERE active = 1 and customer_id =${customer_id}`;
    await db.query(update_query);

    const order_details_string = "'" + JSON.stringify(order_details) + "'";
    const query = `INSERT INTO cart
    (
    customer_id,
    order_details,
    active)
    VALUES
    (${customer_id},${order_details_string},1)
      `;
    console.log(query);
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
  addToCart,
  // updateCartDetails,
  getCartByCustomerId,
};
