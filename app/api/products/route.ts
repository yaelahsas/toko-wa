import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProducts, getProductCount } from '@/lib/db/queries/products';
import { query } from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    // Get products
    const products = await getProducts(limit, offset, category, search);
    
    // Get total count for pagination
    const totalCount = await getProductCount(category);
    
    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + products.length < totalCount
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      type,
      price,
      original_price,
      description,
      image,
      category_id,
      stock,
      min_stock,
      is_active
    } = body;

    // Validate required fields
    if (!name || !type || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Insert new product (without image column as it doesn't exist in the table)
    const result = await query(
      `INSERT INTO products (
        name, type, price, original_price, description, 
        category_id, stock, min_stock, is_active, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name,
        type,
        price,
        original_price || null,
        description || null,
        category_id || null,
        stock,
        min_stock || 5,
        is_active !== false,
        slug
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
