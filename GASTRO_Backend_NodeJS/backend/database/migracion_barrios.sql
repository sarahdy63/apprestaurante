-- =====================================================================
-- Patacón Pisa'o - Migración para una base gastro_db que YA existe.
-- Agrega las tablas de zonas y barrios sin borrar pedidos ni productos.
-- Ejecútelo UNA sola vez (la columna neighborhood_id no se puede agregar dos veces).
-- En una instalación nueva NO hace falta: database.sql ya lo trae todo.
-- =====================================================================
USE gastro_db;

-- Tabla de códigos para recuperar la contraseña del administrador.
--    Un usuario puede tener muchos códigos (relación 1 a N).
--    Solo se guarda el hash del código; vence a los 2 minutos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_codes_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_codes_user (user_id, used, expires_at)
) ENGINE=InnoDB;

-- Tabla de zonas de domicilio (Oriente, Norte, Occidente, Sur).
--    Cada zona tiene una tarifa; si el dueño sube el precio de una zona,
--    se cambia en un solo lugar y aplica a todos sus barrios.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_zones (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  shipping_fee DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabla de barrios con cobertura de domicilio.
--    Una zona tiene muchos barrios (relación 1 a N).
--    active = 0 deja de mostrar el barrio sin borrarlo, para no dañar
--    los pedidos anteriores que lo tienen guardado.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS neighborhoods (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  zone_id TINYINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL UNIQUE,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_neighborhoods_zone FOREIGN KEY (zone_id) REFERENCES delivery_zones(id),
  INDEX idx_neighborhoods_zone (zone_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Conecta la tabla orders con neighborhoods.
-- ---------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN neighborhood_id INT UNSIGNED NULL AFTER phone,
  ADD CONSTRAINT fk_orders_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id);

-- Inserta (o actualiza) la información real del restaurante.
INSERT INTO restaurant_info (id, name, description, phone, email, city, address, schedule_week, schedule_weekend)
VALUES (1, 'Patacón Pisa''o', 'Restaurante de comidas rápidas con productos preparados al momento.', '315 648 1163', 'jhonsuarez@gmail.com', 'Neiva, Huila', 'Calle 19 # 47A-13', 'Lun - Dom 4:30 PM - 11:00 PM', 'Lun - Dom 4:30 PM - 11:00 PM')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description), phone = VALUES(phone),
  email = VALUES(email), city = VALUES(city), address = VALUES(address),
  schedule_week = VALUES(schedule_week), schedule_weekend = VALUES(schedule_weekend);

-- Zonas de domicilio con su tarifa (el dueño puede cambiarlas con un UPDATE).
INSERT IGNORE INTO delivery_zones (id, name, shipping_fee) VALUES
  (1, 'Oriente', 6000.00),
  (2, 'Norte', 8000.00),
  (3, 'Occidente', 10000.00),
  (4, 'Sur', 11000.00);

-- Barrios con cobertura, agrupados por zona.
-- Zona 1 - Oriente (cerca del local, tarifa normal).
INSERT IGNORE INTO neighborhoods (zone_id, name) VALUES
  (1, 'Kennedy'), (1, 'Siete de Agosto'), (1, 'El Jardín'), (1, 'Primero de Mayo'),
  (1, 'La Libertad'), (1, 'Monserrate'), (1, 'Alta Vista'), (1, 'Villa Regina'),
  (1, 'Loma de la Cruz'), (1, 'Ipanema'), (1, 'Diego de Ospina');
-- Zona 2 - Norte (distancia media).
INSERT IGNORE INTO neighborhoods (zone_id, name) VALUES
  (2, 'Las Granjas'), (2, 'Galindo'), (2, 'Calixto'), (2, 'Chapinero'),
  (2, 'Cándido Leguízamo'), (2, 'Santa Inés'), (2, 'Las Mercedes'), (2, 'Villa Magdalena');
-- Zona 3 - Occidente (distancia media).
INSERT IGNORE INTO neighborhoods (zone_id, name) VALUES
  (3, 'Altico'), (3, 'Campo Núñez'), (3, 'Quirinal'), (3, 'Centro'),
  (3, 'Los Mártires'), (3, 'Chicalá'), (3, 'Rodrigo Lara');
-- Zona 4 - Sur (más lejos y con más riesgo, tarifa alta).
INSERT IGNORE INTO neighborhoods (zone_id, name) VALUES
  (4, 'Los Alpes'), (4, 'Timanco'), (4, 'Canaima'), (4, 'Limonar'),
  (4, 'Santa Isabel'), (4, 'Las Brisas');

-- Enlaza los pedidos anteriores con su barrio cuando el nombre coincide.
UPDATE orders o JOIN neighborhoods n ON n.name = o.neighborhood
SET o.neighborhood_id = n.id
WHERE o.neighborhood_id IS NULL;