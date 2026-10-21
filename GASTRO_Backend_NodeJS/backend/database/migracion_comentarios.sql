USE gastro_db;

ALTER TABLE order_items
  ADD COLUMN note VARCHAR(150) NULL AFTER quantity;