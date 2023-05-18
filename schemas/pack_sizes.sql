CREATE TABLE pack_sizes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
    `product_name` varchar(255) NOT NULL,
      `mrp` decimal(10,2) NOT NULL,
        `offered_price` decimal(10,2) NOT NULL,
  no_of_packs INT,
  pack_size INT,
  description VARCHAR(255) NOT NULL
);
