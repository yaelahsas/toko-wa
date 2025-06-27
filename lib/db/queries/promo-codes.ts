import { query } from '../connection';

export interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: Date;
  valid_until: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromoValidation {
  is_valid: boolean;
  discount_amount: number;
  message: string;
  promo_id: number | null;
}

// Validate a promo code
export async function validatePromoCode(
  code: string,
  totalAmount: number
): Promise<PromoValidation | null> {
  try {
    const result = await query(
      'SELECT * FROM validate_promo_code($1, $2)',
      [code, totalAmount]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error validating promo code:', error);
    return null;
  }
}

// Use a promo code (increment usage count)
export async function usePromoCode(promoId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT use_promo_code($1)',
      [promoId]
    );
    
    return result.rows[0]?.use_promo_code || false;
  } catch (error) {
    console.error('Error using promo code:', error);
    return false;
  }
}

// Get active promo codes (for display purposes)
export async function getActivePromoCodes(): Promise<PromoCode[]> {
  try {
    const result = await query(`
      SELECT 
        id,
        code,
        description,
        discount_type,
        discount_value,
        min_purchase,
        max_discount,
        usage_limit,
        usage_count,
        valid_from,
        valid_until,
        is_active,
        created_at,
        updated_at
      FROM promo_codes
      WHERE is_active = true
        AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
        AND valid_from <= CURRENT_TIMESTAMP
        AND (usage_limit IS NULL OR usage_count < usage_limit)
      ORDER BY created_at DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching active promo codes:', error);
    return [];
  }
}

// Get promo code by code
export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  try {
    const result = await query(
      `
      SELECT 
        id,
        code,
        description,
        discount_type,
        discount_value,
        min_purchase,
        max_discount,
        usage_limit,
        usage_count,
        valid_from,
        valid_until,
        is_active,
        created_at,
        updated_at
      FROM promo_codes
      WHERE UPPER(code) = UPPER($1)
      LIMIT 1
      `,
      [code]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching promo code:', error);
    return null;
  }
}

// Create a new promo code
export async function createPromoCode(
  code: string,
  description: string,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  minPurchase: number = 0,
  maxDiscount: number | null = null,
  usageLimit: number | null = null,
  validUntil: Date | null = null
): Promise<PromoCode | null> {
  try {
    const result = await query(
      `
      INSERT INTO promo_codes (
        code, 
        description, 
        discount_type, 
        discount_value, 
        min_purchase, 
        max_discount, 
        usage_limit, 
        valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [code, description, discountType, discountValue, minPurchase, maxDiscount, usageLimit, validUntil]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating promo code:', error);
    return null;
  }
}

// Update promo code active status
export async function updatePromoCodeStatus(
  id: number,
  isActive: boolean
): Promise<boolean> {
  try {
    const result = await query(
      `
      UPDATE promo_codes 
      SET is_active = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [id, isActive]
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error updating promo code status:', error);
    return false;
  }
}
