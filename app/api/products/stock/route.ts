import { NextRequest, NextResponse } from 'next/server';
import { updateProductStock, getLowStockProducts } from '@/lib/db/queries/products';

// GET /api/products/stock - Get low stock products
export async function GET(request: NextRequest) {
  try {
    const products = await getLowStockProducts();
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch low stock products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/stock - Update product stock
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, operation } = body;
    
    // Validate input
    if (!productId || quantity === undefined || !operation) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: productId, quantity, operation' 
        },
        { status: 400 }
      );
    }
    
    if (!['add', 'subtract', 'set'].includes(operation)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid operation. Must be: add, subtract, or set' 
        },
        { status: 400 }
      );
    }
    
    const success = await updateProductStock(productId, quantity, operation);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update stock' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update stock',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
