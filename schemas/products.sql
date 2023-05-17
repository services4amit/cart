 CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category_id` int DEFAULT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `description` json DEFAULT NULL,
  PRIMARY KEY (`id`)
);
