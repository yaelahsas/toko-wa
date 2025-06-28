-- Grant all permissions to postgres and toko_user for all tables

-- Connect as superuser
\c toko_wa;

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
