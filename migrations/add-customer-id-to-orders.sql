-- Add customer_id foreign key to orders table to normalize the database
-- This will eliminate redundant customer data in orders table

-- First, add the customer_id column
ALTER TABLE orders ADD COLUMN customer_id INTEGER;

-- Add foreign key constraint
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Note: We'll keep customer_name, customer_email, customer_phone for now
-- to maintain backward compatibility, but new orders should use customer_id
-- and populate customer data from the customers table
