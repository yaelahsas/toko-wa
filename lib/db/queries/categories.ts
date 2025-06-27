import { query } from '../connection';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  display_order: number;
  created_at: Date;
  product_count?: number;
}

export async function getCategories(): Promise<Category[]> {
  const sql = `
    SELECT 
      c.*,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
    GROUP BY c.id
    ORDER BY c.display_order ASC, c.name ASC
  `;
  
  const result = await query(sql);
  return result.rows;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const sql = `
    SELECT 
      c.*,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
    WHERE c.slug = $1
    GROUP BY c.id
  `;
  
  const result = await query(sql, [slug]);
  return result.rows[0] || null;
}

export async function createCategory(
  name: string,
  slug: string,
  icon?: string,
  displayOrder?: number
): Promise<Category> {
  const sql = `
    INSERT INTO categories (name, slug, icon, display_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await query(sql, [name, slug, icon || null, displayOrder || 0]);
  return result.rows[0];
}

export async function updateCategory(
  id: number,
  updates: Partial<Omit<Category, 'id' | 'created_at'>>
): Promise<Category | null> {
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount}`);
    values.push(updates.name);
    paramCount++;
  }
  
  if (updates.slug !== undefined) {
    fields.push(`slug = $${paramCount}`);
    values.push(updates.slug);
    paramCount++;
  }
  
  if (updates.icon !== undefined) {
    fields.push(`icon = $${paramCount}`);
    values.push(updates.icon);
    paramCount++;
  }
  
  if (updates.display_order !== undefined) {
    fields.push(`display_order = $${paramCount}`);
    values.push(updates.display_order);
    paramCount++;
  }
  
  if (fields.length === 0) {
    return null;
  }
  
  values.push(id);
  
  const sql = `
    UPDATE categories
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await query(sql, values);
  return result.rows[0] || null;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const sql = `DELETE FROM categories WHERE id = $1`;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}
