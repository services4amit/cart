CREATE TABLE status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_type VARCHAR(255),
    orderId INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    created_by VARCHAR(255)
);