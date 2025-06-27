import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode } from '@/lib/db/queries/promo-codes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, totalAmount } = body;
    
    // Validate input
    if (!code || !totalAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kode promo dan total belanja harus diisi' 
        },
        { status: 400 }
      );
    }
    
    // Validate promo code
    const validation = await validatePromoCode(code, totalAmount);
    
    if (!validation) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Terjadi kesalahan saat validasi kode promo' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: validation.is_valid,
      data: {
        discountAmount: validation.discount_amount,
        message: validation.message,
        promoId: validation.promo_id
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan server',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
