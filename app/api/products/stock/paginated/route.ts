import { NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const sortField = searchParams.get('sort') || 'name';
  const sortOrder = searchParams.get('order') || 'asc';

  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name ILIKE $1 OR c.name ILIKE $1
    `;
    const countResult = await query(countQuery, [`%${search}%`]);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated products with stock info
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        CASE 
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.min_stock, 5) THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name ILIKE $1 OR c.name ILIKE $1
      ORDER BY
        CASE WHEN $4 = 'name' THEN p.name END ${sortOrder === 'desc' ? 'DESC' : 'ASC'},
        CASE WHEN $4 = 'stock' THEN p.stock END ${sortOrder === 'desc' ? 'DESC' : 'ASC'},
        CASE WHEN $4 = 'category' THEN c.name END ${sortOrder === 'desc' ? 'DESC' : 'ASC'},
        CASE WHEN $4 = 'created_at' THEN p.created_at END ${sortOrder === 'desc' ? 'DESC' : 'ASC'}
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [`%${search}%`, limit, offset, sortField]);
    
    return NextResponse.json({
      products: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching paginated products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
