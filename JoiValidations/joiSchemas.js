const Joi = require("joi");

const exampleInputForUpdateCart = {
  customer_id: 41,
  order_details: {
    product_id: 1,
    pack_id: 1,
    product_quantity: 4,
  },
};

const CartExpectedSchema = Joi.object().keys({
  customer_id: Joi.number().integer().required(),
  order_details: Joi.object().keys({
    product_id: Joi.number().integer().required(),
    pack_id: Joi.number().integer().required(),
    product_quantity: Joi.number().integer().required(),
  }),
});

const IdSchema = Joi.number().integer().required();

const PageSchema = Joi.number().integer().min(0).optional();

const SearchStringSchema = Joi.string().required();

const AddproductSchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.object().required(),
  price: Joi.number().min(0).required(),
  pack_size: Joi.number().integer().required(),
  category_id: Joi.number().integer().required(),
  product_image: Joi.string().required(),
  total_stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .custom((value, helpers) => {
      const { b2b_stock, b2c_stock } = helpers.root;
      if (value !== b2b_stock + b2c_stock) {
        return helpers.error("invalid total stock");
      }
      return value;
    }, "total stock validation"),
  b2b_stock: Joi.number().integer().min(0).required(),
  b2c_stock: Joi.number().integer().min(0).required(),
});

const UpdateProductSchema = Joi.object().keys({
  description: Joi.object().required(),
  price: Joi.number().min(0).required(),
  product_image: Joi.string().required(),
  total_stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .custom((value, helpers) => {
      const { b2b_stock, b2c_stock } = helpers.root;
      if (value !== b2b_stock + b2c_stock) {
        return helpers.error("invalid total stock");
      }
      return value;
    }, "total stock validation"),
  b2b_stock: Joi.number().integer().min(0).required(),
  b2c_stock: Joi.number().integer().min(0).required(),
});
module.exports = {
  CartExpectedSchema,
  IdSchema,
  PageSchema,
  SearchStringSchema,
  AddproductSchema,
  UpdateProductSchema,
};
