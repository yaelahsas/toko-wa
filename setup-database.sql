-- Connect to database
\c toko_wa;

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price INT NOT NULL,
    original_price INT,
    stock INT DEFAULT 0,
    type VARCHAR(20) CHECK (type IN ('physical', 'voucher')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- Insert sample categories
INSERT INTO categories (name, slug, icon, display_order) VALUES
('Sembako', 'sembako', '🛒', 1),
('Voucher', 'voucher', '🎫', 2),
('Fashion', 'fashion', '👕', 3),
('Elektronik', 'elektronik', '📱', 4);

-- Insert sample products
INSERT INTO products (category_id, name, slug, description, price, original_price, type, stock) VALUES
(1, 'Beras Premium 5kg', 'beras-premium-5kg', 'Beras kualitas premium', 65000, 70000, 'physical', 100),
(2, 'Voucher Gaming 50K', 'voucher-gaming-50k', 'Voucher untuk berbagai game online', 48000, 50000, 'voucher', 999),
(3, 'Kaos Polos Premium', 'kaos-polos-premium', 'Kaos cotton combed 30s', 75000, NULL, 'physical', 50);

-- Grant permissions to toko_user
GRANT ALL ON ALL TABLES IN SCHEMA public TO toko_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO toko_user;
