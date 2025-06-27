-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2), -- For percentage discounts
  usage_limit INTEGER DEFAULT NULL, -- NULL means unlimited
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until) VALUES
('WELCOME10', 'Diskon 10% untuk pelanggan baru', 'percentage', 10, 50000, 20000, 100, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('HEMAT20K', 'Potongan Rp 20.000', 'fixed', 20000, 100000, NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '7 days'),
('RAMADAN15', 'Diskon Ramadan 15%', 'percentage', 15, 75000, 50000, 50, CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Create function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR,
  p_total_amount DECIMAL
) RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount DECIMAL,
  message TEXT,
  promo_id INTEGER
) AS $$
DECLARE
  v_promo RECORD;
  v_discount DECIMAL;
BEGIN
  -- Get promo code details
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
  LIMIT 1;
  
  -- Check if promo exists
  IF v_promo IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Kode promo tidak valid'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if promo is expired
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < CURRENT_TIMESTAMP THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Kode promo sudah kadaluarsa'::TEXT, v_promo.id;
    RETURN;
  END IF;
  
  -- Check if promo has started
  IF v_promo.valid_from > CURRENT_TIMESTAMP THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Kode promo belum berlaku'::TEXT, v_promo.id;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Kode promo sudah mencapai batas penggunaan'::TEXT, v_promo.id;
    RETURN;
  END IF;
  
  -- Check minimum purchase
  IF p_total_amount < v_promo.min_purchase THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 
      FORMAT('Minimal belanja Rp %s untuk menggunakan kode ini', TO_CHAR(v_promo.min_purchase, 'FM999,999,999'))::TEXT, 
      v_promo.id;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := p_total_amount * (v_promo.discount_value / 100);
    -- Apply max discount cap if exists
    IF v_promo.max_discount IS NOT NULL AND v_discount > v_promo.max_discount THEN
      v_discount := v_promo.max_discount;
    END IF;
  ELSE
    v_discount := v_promo.discount_value;
  END IF;
  
  -- Make sure discount doesn't exceed total amount
  IF v_discount > p_total_amount THEN
    v_discount := p_total_amount;
  END IF;
  
  RETURN QUERY SELECT true, v_discount, 'Kode promo berhasil diterapkan'::TEXT, v_promo.id;
END;
$$ LANGUAGE plpgsql;

-- Create function to use promo code (increment usage count)
CREATE OR REPLACE FUNCTION use_promo_code(p_promo_id INTEGER) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE promo_codes 
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_promo_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
