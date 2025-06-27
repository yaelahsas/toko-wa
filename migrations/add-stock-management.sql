-- Add stock management fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- Add stock alert view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.stock,
    p.min_stock,
    c.name as category_name,
    CASE 
        WHEN p.stock = 0 THEN 'out_of_stock'
        WHEN p.stock <= p.min_stock THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
AND (p.stock = 0 OR p.stock <= p.min_stock);

-- Update existing products with min_stock values
UPDATE products SET min_stock = 10 WHERE type = 'physical';
UPDATE products SET min_stock = 0 WHERE type = 'voucher';
