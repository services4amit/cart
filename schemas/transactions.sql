CREATE TABLE `transactions` (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_status VARCHAR(255),
    transaction_type VARCHAR(255),
    payment_id INT,
    order_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    created_by VARCHAR(255)
);