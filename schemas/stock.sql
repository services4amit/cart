CREATE TABLE stock (
id INT PRIMARY KEY AUTO_INCREMENT,
product_id INT NOT NULL,
total_stock INT NOT NULL DEFAULT 0,
b2b_stock INT NOT NULL DEFAULT 0,
b2c_stock INT NOT NULL DEFAULT 0,
b2b_inward INT NOT NULL DEFAULT 0,
b2c_inward INT NOT NULL DEFAULT 0,
b2b_dump INT NOT NULL DEFAULT 0,
b2c_dump INT NOT NULL DEFAULT 0,
b2b_remaining INT NOT NULL DEFAULT 0,
b2c_remaining INT NOT NULL DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
updated_by VARCHAR(255)
);

/*

total stock: The total quantity of the product in stock, including both B2B and B2C stock.
b2bstock: The quantity of the product available for sale to B2B customers.
b2cstock: The quantity of the product available for sale to B2C customers.
b2binward: The quantity of the product that is expected to arrive from a B2B supplier. 
b2cinward: The quantity of the product that is expected to arrive from a B2C supplier.
b2bdump: The quantity of the product that is damaged or unsellable in B2B stock.
b2cdump: The quantity of the product that is damaged or unsellable in B2C stock.
b2bremaining: The remaining quantity of the product available for sale to B2B customers after deducting the b2bdump and b2binward quantities.
b2cremaining: The remaining quantity of the product available for sale to B2C customers after deducting the b2cdump and b2cinward quantities.
product_id: A unique identifier for each product in the stock table. 

*/
