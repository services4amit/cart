CREATE TABLE cart (
id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
order_details JSON,
active boolean
);