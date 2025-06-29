import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db/queries/products';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;

  const offset = (page - 1) * limit;

  try {
    const products = await getProducts(limit, offset, category, search);
    return NextResponse.json({ products, page, limit });
  } catch (error) {
    console.error('Error fetching paginated products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
