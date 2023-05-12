CREATE TABLE orders (
order_id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
details JSON,
transaction_id INT,
status_id INT
);