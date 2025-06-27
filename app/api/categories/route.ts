import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/db/queries/categories';

export async function GET(request: NextRequest) {
  try {
    const categories = await getCategories();
    
    return NextResponse.json({
      success: true,
      data: categories
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
