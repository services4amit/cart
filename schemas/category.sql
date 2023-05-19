CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  created_by VARCHAR(255)
);

INSERT INTO
  `categories`
VALUES
  ('eptk'),
  ('opsd'),
  ('uvdy'),
  ('zmgd'),
  ('dbbk');