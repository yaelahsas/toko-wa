import { query } from '../connection';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  stock: number;
  type: 'physical' | 'voucher';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  category_slug?: string;
  images?: Array<{
    id: number;
    url: string;
    is_primary: boolean;
  }>;
}

export async function getProducts(
  limit = 20,
  offset = 0,
  category?: string,
  search?: string
): Promise<Product[]> {
  let sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL), 
        '[]'
      ) as images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.is_active = true
  `;
  
  const params: any[] = [];
  let paramCount = 1;

  if (category) {
    sql += ` AND c.slug = $${paramCount}`;
    params.push(category);
    paramCount++;
  }

  if (search) {
    sql += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  sql += ` GROUP BY p.id, c.id`;
  sql += ` ORDER BY p.created_at DESC`;
  sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL), 
        '[]'
      ) as images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.slug = $1 AND p.is_active = true
    GROUP BY p.id, c.id
  `;
  
  const result = await query(sql, [slug]);
  return result.rows[0] || null;
}

export async function getProductById(id: number): Promise<Product | null> {
  const sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL), 
        '[]'
      ) as images
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = $1 AND p.is_active = true
    GROUP BY p.id, c.id
  `;
  
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function searchProducts(searchTerm: string, limit = 20): Promise<Product[]> {
  const sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      ts_rank(
        to_tsvector('indonesian', p.name || ' ' || COALESCE(p.description, '')),
        plainto_tsquery('indonesian', $1)
      ) as rank
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
      p.is_active = true AND
      (
        p.name ILIKE $2 OR 
        p.description ILIKE $2 OR
        to_tsvector('indonesian', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('indonesian', $1)
      )
    ORDER BY rank DESC, p.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [searchTerm, `%${searchTerm}%`, limit]);
  return result.rows;
}

export async function getProductCount(category?: string): Promise<number> {
  let sql = `
    SELECT COUNT(*) as count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
  `;
  
  const params: any[] = [];
  
  if (category) {
    sql += ` AND c.slug = $1`;
    params.push(category);
  }
  
  const result = await query(sql, params);
  return parseInt(result.rows[0].count);
}
