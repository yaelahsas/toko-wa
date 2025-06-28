-- Connect to database as superuser first
\c toko_wa postgres;

-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL DEFAULT 'TOKO SEMBAKO SRI REJEKI UTAMA',
    slogan VARCHAR(255) DEFAULT 'Belanja Dekat, Lebih Hemat',
    logo_filename VARCHAR(255) DEFAULT '/placeholder-logo.png',
    admin_phone VARCHAR(20) DEFAULT '6283853399847',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO store_settings (store_name, slogan, admin_phone) 
VALUES ('TOKO SEMBAKO SRI REJEKI UTAMA', 'Belanja Dekat, Lebih Hemat', '6283853399847')
ON CONFLICT DO NOTHING;

-- Grant permissions to toko_user
GRANT ALL PRIVILEGES ON store_settings TO toko_user;
GRANT ALL PRIVILEGES ON SEQUENCE store_settings_id_seq TO toko_user;

-- Also grant usage on schema
GRANT USAGE ON SCHEMA public TO toko_user;
GRANT CREATE ON SCHEMA public TO toko_user;
