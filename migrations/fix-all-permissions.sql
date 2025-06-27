-- Grant permissions on all tables to postgres user
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE orders TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE order_items TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE categories TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE promo_codes TO postgres;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
