CREATE TABLE orders (
order_id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
details JSON,
price decimal(10,2) NOT NULL,
transaction_id INT,
status_id INT
);
