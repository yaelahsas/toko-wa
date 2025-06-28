-- Combined setup database script
-- Connect to database
\c toko_wa;

-- Grant all permissions to postgres and toko_user for all tables

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE toko_wa TO postgres;
GRANT ALL PRIVILEGES ON DATABASE toko_wa TO toko_user;

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO toko_user;

-- Grant all privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO toko_user;

-- Grant all privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO toko_user;

-- Grant all privileges on all functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO toko_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO toko_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO toko_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO toko_user;

-- Make sure toko_user can create tables
GRANT CREATE ON SCHEMA public TO toko_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO toko_user;

-- Specific grants for orders and order_items tables
GRANT ALL PRIVILEGES ON orders TO postgres;
GRANT ALL PRIVILEGES ON orders TO toko_user;

GRANT ALL PRIVILEGES ON order_items TO postgres;
GRANT ALL PRIVILEGES ON order_items TO toko_user;

GRANT ALL PRIVILEGES ON orders_id_seq TO postgres;
GRANT ALL PRIVILEGES ON orders_id_seq TO toko_user;

GRANT ALL PRIVILEGES ON order_items_id_seq TO postgres;
GRANT ALL PRIVILEGES ON order_items_id_seq TO toko_user;

-- Show current permissions
\dp orders
\dp order_items

-- Insert sample orders for testing
-- First, let's insert orders one by one and get their IDs

-- Order 1
INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  status,
  subtotal,
  discount_amount,
  total_amount,
  promo_code,
  notes,
  created_at
) VALUES (
  'ORD-1704067200-ABC12',
  'Budi Santoso',
  'budi@email.com',
  '081234567890',
  'pending',
  188000,
  0,
  188000,
  NULL,
  'Pesanan melalui WhatsApp',
  NOW() - INTERVAL '2 hours'
);

-- Get the order ID and insert items
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  1,
  'Beras Premium 5kg',
  65000,
  1,
  65000
FROM orders o WHERE o.order_number = 'ORD-1704067200-ABC12';

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  2,
  'Voucher Gaming 50K',
  48000,
  1,
  48000
FROM orders o WHERE o.order_number = 'ORD-1704067200-ABC12';

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  3,
  'Kaos Polos Premium',
  75000,
  1,
  75000
FROM orders o WHERE o.order_number = 'ORD-1704067200-ABC12';

-- Order 2
INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  status,
  subtotal,
  discount_amount,
  total_amount,
  promo_code,
  notes,
  created_at
) VALUES (
  'ORD-1704063600-DEF34',
  'Siti Rahayu',
  'siti@email.com',
  '081234567891',
  'processing',
  205000,
  20000,
  185000,
  'DISKON10',
  'Pesanan dengan promo code',
  NOW() - INTERVAL '1 day'
);

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  1,
  'Beras Premium 5kg',
  65000,
  2,
  130000
FROM orders o WHERE o.order_number = 'ORD-1704063600-DEF34';

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  3,
  'Kaos Polos Premium',
  75000,
  1,
  75000
FROM orders o WHERE o.order_number = 'ORD-1704063600-DEF34';

-- Order 3
INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  status,
  subtotal,
  discount_amount,
  total_amount,
  promo_code,
  notes,
  created_at
) VALUES (
  'ORD-1704060000-GHI56',
  'Ahmad Wijaya',
  NULL,
  '081234567892',
  'completed',
  75000,
  0,
  75000,
  NULL,
  'Pesanan selesai',
  NOW() - INTERVAL '3 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  3,
  'Kaos Polos Premium',
  75000,
  1,
  75000
FROM orders o WHERE o.order_number = 'ORD-1704060000-GHI56';

-- Order 4
INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  status,
  subtotal,
  discount_amount,
  total_amount,
  promo_code,
  notes,
  created_at
) VALUES (
  'ORD-1704056400-JKL78',
  'Maria Gonzalez',
  'maria@email.com',
  '081234567893',
  'cancelled',
  113000,
  0,
  113000,
  NULL,
  'Dibatalkan oleh pelanggan',
  NOW() - INTERVAL '5 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  1,
  'Beras Premium 5kg',
  65000,
  1,
  65000
FROM orders o WHERE o.order_number = 'ORD-1704056400-JKL78';

INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
SELECT 
  o.id,
  2,
  'Voucher Gaming 50K',
  48000,
  1,
  48000
FROM orders o WHERE o.order_number = 'ORD-1704056400-JKL78';

-- Update product stock (simulate stock reduction for physical products only)
-- Note: Only update if products exist and are physical type
UPDATE products SET stock = GREATEST(stock - 4, 0) WHERE id = 1 AND type = 'physical';
UPDATE products SET stock = GREATEST(stock - 3, 0) WHERE id = 3 AND type = 'physical';

-- Verify setup
SELECT 'Orders count: ' || COUNT(*) FROM orders;
SELECT 'Order items count: ' || COUNT(*) FROM order_items;
SELECT 'Orders by status:' as status_count;
SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY COUNT(*) DESC;

-- Show table permissions
\echo '\nPermissions for orders table:'
\dp orders
\echo '\nPermissions for order_items table:'
\dp order_items
