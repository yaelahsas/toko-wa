import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getProductBySlug } from '@/lib/db/queries/products';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if id is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    
    const product = isNumeric 
      ? await getProductById(parseInt(id))
      : await getProductBySlug(id);
    
    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product
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
