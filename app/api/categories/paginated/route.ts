import { NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM categories
      WHERE name ILIKE $1
    `;
    const countResult = await query(countQuery, [`%${search}%`]);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated categories
    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.name ILIKE $1
      GROUP BY c.id
      ORDER BY
        CASE WHEN $4 = 'name' THEN c.name END ${searchParams.get('order') === 'desc' ? 'DESC' : 'ASC'},
        CASE WHEN $4 = 'created_at' THEN c.created_at END ${searchParams.get('order') === 'desc' ? 'DESC' : 'ASC'},
        CASE WHEN $4 = 'product_count' THEN COUNT(p.id) END ${searchParams.get('order') === 'desc' ? 'DESC NULLS LAST' : 'ASC NULLS LAST'}
      LIMIT $2 OFFSET $3
    `;

    const sortField = searchParams.get('sort') || '';
    const result = await query(sql, [`%${search}%`, limit, offset, sortField]);
    
    return NextResponse.json({
      categories: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching paginated categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
