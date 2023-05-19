CREATE TABLE pack_sizes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    mrp DECIMAL(10, 2) NOT NULL,
    offered_price DECIMAL(10, 2) NOT NULL,
    no_of_packs INT,
    pack_size INT,
    description VARCHAR(255) NOT NULL,
    net_weight INT AS (pack_size * no_of_packs),
    total_price DECIMAL(10, 2) AS (net_weight * offered_price),
    discount DECIMAL(10, 2) AS(((obj.mrp - obj.offered_price) / obj.mrp) * 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    created_by VARCHAR(255)
);