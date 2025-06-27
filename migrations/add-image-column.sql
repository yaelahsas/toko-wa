-- Add image column to products table
ALTER TABLE products 
ADD COLUMN image VARCHAR(500) DEFAULT '/placeholder.svg?height=200&width=300';

-- Update existing products to use placeholder
UPDATE products 
SET image = '/placeholder.svg?height=200&width=300' 
WHERE image IS NULL;
