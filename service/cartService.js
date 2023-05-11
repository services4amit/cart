const db = require("../connection");

const getCartByCustomerId = async (customerId) => {
  //db call to fetch the row by customerId;
  try {
    //await db.query()
  } catch (err) {
    //console.log(err);
  }
  return "id";
};

const addToCart = async (cartDetails) => {
  //db call to create a row
  try {
    //await db.query()
  } catch (err) {
    //console.log(err);
  }
  return "id";
};

const updateCartDetails = async (cartDetails) => {
  //db call to update the row
  try {
    //await db.query()
  } catch (err) {
    //console.log(err);
  }
  return "id";
};

module.exports = {
  addToCart,
  updateCartDetails,
  getCartByCustomerId,
};
