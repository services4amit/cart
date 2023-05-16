CREATE TABLE pack_sizes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
  size INT,
  description VARCHAR(255) NOT NULL
);
