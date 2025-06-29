--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: use_promo_code(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.use_promo_code(p_promo_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE promo_codes 
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_promo_id;
  
  RETURN FOUND;
END;
$$;


--
-- Name: validate_promo_code(character varying, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_promo_code(p_code character varying, p_total_amount numeric) RETURNS TABLE(is_valid boolean, discount_amount numeric, message text, promo_id integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon character varying(50),
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    phone_number character varying(20) NOT NULL,
    order_count integer DEFAULT 0 NOT NULL,
    last_order_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    category_id integer,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    price integer NOT NULL,
    original_price integer,
    stock integer DEFAULT 0,
    type character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    min_stock integer DEFAULT 5,
    image character varying(500) DEFAULT '/placeholder.svg?height=200&width=300'::character varying,
    CONSTRAINT products_type_check CHECK (((type)::text = ANY ((ARRAY['physical'::character varying, 'voucher'::character varying])::text[])))
);


--
-- Name: low_stock_products; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.low_stock_products AS
 SELECT p.id,
    p.name,
    p.stock,
    p.min_stock,
    c.name AS category_name,
        CASE
            WHEN (p.stock = 0) THEN 'out_of_stock'::text
            WHEN (p.stock <= p.min_stock) THEN 'low_stock'::text
            ELSE 'in_stock'::text
        END AS stock_status
   FROM (public.products p
     LEFT JOIN public.categories c ON ((p.category_id = c.id)))
  WHERE ((p.is_active = true) AND ((p.stock = 0) OR (p.stock <= p.min_stock)));


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    product_name character varying(255) NOT NULL,
    product_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255),
    customer_phone character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    subtotal numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    promo_code character varying(50),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    customer_id integer
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    display_order integer DEFAULT 0
);


--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_purchase numeric(10,2) DEFAULT 0,
    max_discount numeric(10,2),
    usage_limit integer,
    usage_count integer DEFAULT 0,
    valid_from timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valid_until timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT promo_codes_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: promo_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promo_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promo_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promo_codes_id_seq OWNED BY public.promo_codes.id;


--
-- Name: store_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_settings (
    id integer NOT NULL,
    store_name character varying(255) DEFAULT 'TOKO SEMBAKO SRI REJEKI UTAMA'::character varying NOT NULL,
    slogan character varying(255) DEFAULT 'Belanja Dekat, Lebih Hemat'::character varying,
    logo_filename character varying(255),
    admin_phone character varying(20) DEFAULT '6283853399847'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_settings_id_seq OWNED BY public.store_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255),
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: promo_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes ALTER COLUMN id SET DEFAULT nextval('public.promo_codes_id_seq'::regclass);


--
-- Name: store_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings ALTER COLUMN id SET DEFAULT nextval('public.store_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: customers customers_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_number_key UNIQUE (phone_number);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: store_settings store_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings
    ADD CONSTRAINT store_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_orders_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_slug ON public.products USING btree (slug);


--
-- Name: idx_promo_codes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_active ON public.promo_codes USING btree (is_active);


--
-- Name: idx_promo_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_promo_codes_code ON public.promo_codes USING btree (code);


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: FUNCTION use_promo_code(p_promo_id integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.use_promo_code(p_promo_id integer) TO toko_user;


--
-- Name: FUNCTION validate_promo_code(p_code character varying, p_total_amount numeric); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_promo_code(p_code character varying, p_total_amount numeric) TO toko_user;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.categories TO toko_user;


--
-- Name: SEQUENCE categories_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.categories_id_seq TO toko_user;


--
-- Name: TABLE customers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.customers TO toko_user;


--
-- Name: SEQUENCE customers_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.customers_id_seq TO toko_user;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.products TO toko_user;


--
-- Name: TABLE low_stock_products; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.low_stock_products TO toko_user;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.order_items TO toko_user;


--
-- Name: SEQUENCE order_items_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.order_items_id_seq TO toko_user;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.orders TO toko_user;


--
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.orders_id_seq TO toko_user;


--
-- Name: TABLE product_images; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.product_images TO toko_user;


--
-- Name: SEQUENCE product_images_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.product_images_id_seq TO toko_user;


--
-- Name: SEQUENCE products_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.products_id_seq TO toko_user;


--
-- Name: TABLE promo_codes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.promo_codes TO toko_user;


--
-- Name: SEQUENCE promo_codes_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.promo_codes_id_seq TO toko_user;


--
-- Name: TABLE store_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.store_settings TO toko_user;


--
-- Name: SEQUENCE store_settings_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.store_settings_id_seq TO toko_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.users TO toko_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.users_id_seq TO toko_user;


--
-- PostgreSQL database dump complete
--

