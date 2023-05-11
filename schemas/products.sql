CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  pack_size VARCHAR(50),
  category_id INT,
  product_image VARCHAR(255),
  total_stock INT,
  b2b_stock INT,
  b2c_stock INT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
