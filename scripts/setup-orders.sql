-- Setup script for orders management
-- Run this script as superuser (postgres)

-- 1. Connect to database
\c toko_wa;

-- 2. Create or update tables
\i setup-database.sql

-- 3. Grant all permissions
\i scripts/grant-permissions.sql

-- 4. Add sample orders data
\i scripts/add-sample-orders.sql

-- 5. Verify setup
SELECT 'Orders count: ' || COUNT(*) FROM orders;
SELECT 'Order items count: ' || COUNT(*) FROM order_items;
SELECT 'Orders by status:' as status_count;
SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY COUNT(*) DESC;

-- 6. Show table permissions
\echo '\nPermissions for orders table:'
\dp orders
\echo '\nPermissions for order_items table:'
\dp order_items
