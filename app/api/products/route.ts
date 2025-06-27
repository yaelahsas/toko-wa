import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProductCount } from '@/lib/db/queries/products';

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
