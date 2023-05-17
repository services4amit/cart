CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `details` json DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `status_id` int DEFAULT NULL,
  PRIMARY KEY (`order_id`)
)
