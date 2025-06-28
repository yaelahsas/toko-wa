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
  min_stock?: number;
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
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
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
      CASE 
        WHEN p.stock = 0 THEN 'out_of_stock'
        WHEN p.stock <= COALESCE(p.min_stock, 5) THEN 'low_stock'
        ELSE 'in_stock'
      END as stock_status,
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

  // Add image property as primary image url for convenience
  const productsWithImage = result.rows.map((product: any) => {
    const primaryImage = product.images.find((img: any) => img.is_primary);
    return {
      ...product,
      image: primaryImage ? primaryImage.url : '/placeholder.svg',
    };
  });

  return productsWithImage;
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

// Stock management functions
export async function updateProductStock(
  productId: number, 
  quantity: number,
  operation: 'add' | 'subtract' | 'set'
): Promise<boolean> {
  let sql = '';
  
  switch (operation) {
    case 'add':
      sql = 'UPDATE products SET stock = stock + $2 WHERE id = $1';
      break;
    case 'subtract':
      sql = 'UPDATE products SET stock = GREATEST(0, stock - $2) WHERE id = $1';
      break;
    case 'set':
      sql = 'UPDATE products SET stock = $2 WHERE id = $1';
      break;
  }
  
  const result = await query(sql, [productId, quantity]);
  return (result.rowCount ?? 0) > 0;
}

export async function getLowStockProducts(): Promise<Product[]> {
  const sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      CASE 
        WHEN p.stock = 0 THEN 'out_of_stock'
        WHEN p.stock <= COALESCE(p.min_stock, 5) THEN 'low_stock'
        ELSE 'in_stock'
      END as stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    AND (p.stock = 0 OR p.stock <= COALESCE(p.min_stock, 5))
    ORDER BY p.stock ASC, p.name ASC
  `;
  
  const result = await query(sql);
  return result.rows;
}

export async function checkProductAvailability(
  productId: number, 
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number; message?: string }> {
  const sql = 'SELECT stock, name FROM products WHERE id = $1 AND is_active = true';
  const result = await query(sql, [productId]);
  
  if (result.rows.length === 0) {
    return { available: false, currentStock: 0, message: 'Produk tidak ditemukan' };
  }
  
  const product = result.rows[0];
  
  if (product.stock === 0) {
    return { available: false, currentStock: 0, message: 'Stok habis' };
  }
  
  if (product.stock < requestedQuantity) {
    return { 
      available: false, 
      currentStock: product.stock, 
      message: `Stok tidak cukup. Tersisa ${product.stock} item` 
    };
  }
  
  return { available: true, currentStock: product.stock };
}
