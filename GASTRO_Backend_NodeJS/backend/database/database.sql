-- Crea la base de datos si todavía no existe.
CREATE DATABASE IF NOT EXISTS gastro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Selecciona la base de datos de trabajo.
USE gastro_db;

-- Tabla de usuarios administradores.
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla maestra de categorías del menú.
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de productos que se muestran en el menú.
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL,
  image_url VARCHAR(500) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- Tabla de cabecera de pedidos y datos de entrega.
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  customer_first_name VARCHAR(100) NOT NULL,
  customer_last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('RECIBIDO','PREPARANDO','EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'RECIBIDO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

-- Tabla de detalle de productos incluidos en cada pedido.
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- Tabla de información pública del restaurante.
CREATE TABLE IF NOT EXISTS restaurant_info (
  id TINYINT UNSIGNED PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(180) NULL,
  city VARCHAR(100) NULL,
  address VARCHAR(255) NULL,
  schedule_week VARCHAR(100) NULL,
  schedule_weekend VARCHAR(100) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Inserta las categorías iniciales sin duplicarlas.
INSERT IGNORE INTO categories (name) VALUES ('Hamburguesas'), ('Picadas'), ('Salchipapas'), ('Toppings'), ('Bebidas');

-- Inserta la información institucional inicial del restaurante.
INSERT INTO restaurant_info (id, name, description, phone, email, city, address, schedule_week, schedule_weekend)
VALUES (1, 'GASTRO', 'Restaurante de comida rápida con productos preparados al momento.', '+57 300 123 4567', 'info@gastro.com', 'Neiva, Huila', 'Carrera 12 # 2 - 71', 'Lun - Jue 12:00 PM - 10:00 PM', 'Vie - Dom 12:00 PM - 11:30 PM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Los productos de demostración del frontend original se insertan a continuación.
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 1, c.id, 'Gastro Original', '180 g de Angus, queso cheddar, cebolla caramelizada y salsa secreta.', 32000.00, 'assets/img/Hamburguesa-la_infiel.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 1);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 2, c.id, 'Truffle Swiss', 'Hongos silvestres salteados, queso suizo y mayonesa de trufa.', 38500.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 2);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 3, c.id, 'Avocado', 'Chile serrano, láminas de aguacate fresco y aderezo picante.', 28000.00, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 3);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 4, c.id, 'El Bacon', 'Doble tocineta ahumada, cheddar y cebollas crujientes.', 32000.00, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=80', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 4);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 5, c.id, 'Picada Imperial', 'Carnes mixtas, papa criolla, chorizo y salsas de la casa.', 58000.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 5);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 6, c.id, 'Salchipapa Especial', 'Papas fritas, salchicha, tocineta, maíz y queso gratinado.', 28000.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 6);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 7, c.id, 'Limonada de Coco', 'Refrescante mezcla cremosa preparada al momento.', 9000.00, 'assets/img/Bebidas-limonada_coco.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 7);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 9, c.id, 'La Cachona', 'Carne de res a la parrilla, doble queso derretido, tocineta crocante, salsa picante casera y cebolla caramelizada.', 30000.00, 'assets/img/Hamburguesa-la_cachona.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 9);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 10, c.id, 'La Infiel', 'Carne de res y pollo apanado, servida con salsa BBQ y salsa de ajo.', 22000.00, 'assets/img/Hamburguesa-la_infiel.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 10);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 11, c.id, 'La Chismosa', 'Carne de res, tocineta, queso, piña, jalapeño, huevo frito y cebolla morada.', 27000.00, 'assets/img/Hamburguesa-la_chismosa.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 11);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 12, c.id, 'La Arrepentida', 'Doble carne, triple queso, tocineta y salsa de la casa.', 25000.00, 'assets/img/hamburguesa-la_arrepentida.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 12);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 13, c.id, 'La Patacona', 'Dos patacones crocantes, carne de res a la parrilla, queso, tomate y cebolla.', 20000.00, 'assets/img/Hamburguesa-la_patacona.jpg', 1 FROM categories c
WHERE c.name = 'Hamburguesas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 13);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 14, c.id, 'La Compinche', 'Chorizo, morcilla, chicharrón, papa criolla, arepa y patacones.', 58000.00, 'assets/img/Picadas-la_compinche.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 14);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 15, c.id, 'La Parrandera', 'Carne de res, pollo, chorizo, chicharrón, morcilla, papa criolla, yuca frita y patacones.', 58000.00, 'assets/img/Picadas-la_parrandera.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 15);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 16, c.id, 'La Campesina', 'Chicharrón, chorizo, arepa, papa criolla, yuca frita y suero costeño.', 58000.00, 'assets/img/Picadas-la_campesina.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 16);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 17, c.id, 'La Corraleja', 'Costilla de cerdo, chorizo, chicharrón, plátano maduro, papa criolla y guacamole.', 58000.00, 'assets/img/Picadas-la_corraleja.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 17);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 18, c.id, 'La Fondera', 'Carne de res, chicharrón, arepa, patacón y ensalada fresca.', 58000.00, 'assets/img/Picadas-la_fondera.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 18);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 19, c.id, 'La Tropilla', 'Carne de res, pollo, chorizo, morcilla, chicharrón, papa criolla, patacones y yuca frita.', 58000.00, 'assets/img/Picadas-la_tropilla.jpg', 1 FROM categories c
WHERE c.name = 'Picadas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 19);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 20, c.id, 'La Clásica', 'Papas fritas, salchicha, queso fundido y salsas de la casa (rosada, tomate, mostaza).', 12000.00, 'assets/img/Salchipapas-la_clasica.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 20);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 21, c.id, 'La Cargada', 'Papas fritas, salchicha, tocineta, queso fundido, maíz tierno y salsas.', 16000.00, 'assets/img/Salchipapas-la_cargada.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 21);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 22, c.id, 'La Ranchera', 'Papas fritas, salchicha, chorizo, cebolla caramelizada, queso fundido y salsa picante.', 15000.00, 'assets/img/Salchipapas-la_ranchera.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 22);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 23, c.id, 'La Tropical', 'Papas fritas, salchicha, piña asada, queso fundido y salsa de la casa.', 17000.00, 'assets/img/Salchipapas-la_tropical.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 23);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 24, c.id, 'La Completa', 'Papas fritas, salchicha, carne desmechada, tocineta, queso fundido, huevo frito y maíz.', 19000.00, 'assets/img/Salchipapas-la_completa.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 24);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 25, c.id, 'La Criolla', 'Papas fritas, salchicha, papa criolla, queso fundido y hogao.', 15000.00, 'assets/img/Salchipapas-la_criolla.jpg', 1 FROM categories c
WHERE c.name = 'Salchipapas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 25);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 26, c.id, 'Coca-Cola', '', 5000.00, 'assets/img/Bebidas-CocaCola.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 26);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 27, c.id, 'Coca-Cola Zero', '', 5000.00, 'assets/img/Bebidas-CocaCola_0.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 27);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 28, c.id, 'Sprite', '', 5000.00, 'assets/img/Bebidas-Sprite.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 28);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 29, c.id, 'Colombiana', '', 5000.00, 'assets/img/Bebidas-Colombiana.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 29);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 30, c.id, 'Soda de Frutos Rojos', '', 6000.00, 'assets/img/Bebidas-frutos_rojos.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 30);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 31, c.id, 'Agua Cristal', '', 4000.00, 'assets/img/Bebidas-agua_cristal.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 31);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 32, c.id, 'Agua Cristal Con Gas', '', 4500.00, 'assets/img/Bebidas-agua_gas.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 32);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 33, c.id, 'Jugo Natural de Mora', 'Mora fresca licuada con un toque de panela, preparada al momento.', 8500.00, 'assets/img/Bebidas-jugo_mora.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 33);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 34, c.id, 'Jugo Natural de fresa', 'Fresa recién licuada, refrescante y ligeramente dulce.', 8500.00, 'assets/img/Bebidas-fresa.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 34);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 35, c.id, 'Jugo Natural de Maracuyá', 'Maracuyá fresco, dulce y ácido, preparado al instante.', 9000.00, 'assets/img/Bebidas-maracuya.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 35);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 36, c.id, 'Limonada Natural', 'Limón fresco recién exprimido, endulzado al gusto.', 8000.00, 'assets/img/Bebidas-limonada.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 36);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 37, c.id, 'Jugo Natural de Mango', 'Mango maduro licuado, cremoso y dulce, preparado al momento.', 8500.00, 'assets/img/Bebidas-mango.jpg', 1 FROM categories c
WHERE c.name = 'Bebidas' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 37);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 38, c.id, 'Extra Queso Derretido', 'Porción adicional de queso fundido bien derretido.', 4000.00, 'assets/img/Topping-queso.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 38);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 39, c.id, 'Adición de Papas', 'Porción extra de papas fritas crocantes.', 6000.00, 'assets/img/Topping-papas.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 39);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 40, c.id, 'Extra Carne para Hamburguesa', 'Carne adicional de res, 100% Angus, a la parrilla.', 8000.00, 'assets/img/Topping-carne.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 40);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 41, c.id, 'Jalapeños', 'Porción de jalapeños picantes en rodajas.', 3000.00, 'assets/img/Topping-jalapeños.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 41);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 42, c.id, 'Queso Rallado', 'Porción de queso rallado para espolvorear.', 3500.00, 'assets/img/Topping-queso_rallado.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 42);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 43, c.id, 'Salsa de Ajo', 'Salsa cremosa de ajo, preparada en casa.', 2000.00, 'assets/img/Topping-salsa_ajo.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 43);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 44, c.id, 'Salsa de Tomate', 'Salsa de tomate clásica.', 1500.00, 'assets/img/Topping-salsa_tomate.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 44);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 45, c.id, 'Salsa de Maíz Dulce', 'Salsa cremosa preparada con maíz dulce.', 2500.00, 'assets/img/Topping-salsa_maiz.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 45);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 46, c.id, 'Adición de Maíz Tierno', 'Porción extra de maíz tierno.', 3000.00, 'assets/img/Topping-maiz_tierno.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 46);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 47, c.id, 'Adición de carne  desmechada', 'Porción adicional de carne desmechada jugosita.', 9000.00, 'assets/img/Topping-carne_desmechada.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 47);
INSERT INTO products (id, category_id, name, description, price, image_url, active)
SELECT 48, c.id, 'Cebolla Caramelizada', 'Porción de cebolla caramelizada, dulce y suave.', 3500.00, 'assets/img/Topping-cebolla.jpg', 1 FROM categories c
WHERE c.name = 'Toppings' AND NOT EXISTS (SELECT 1 FROM products p2 WHERE p2.id = 48);

-- Ajusta el siguiente AUTO_INCREMENT para que nuevos productos usen ids superiores a los de demostración.
ALTER TABLE products AUTO_INCREMENT = 100;
