import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db/connection'

interface CreateOrderRequest {
  customer_name: string
  customer_email?: string
  customer_phone: string
  items: {
    product_id: number
    quantity: number
  }[]
  promo_code?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    
    // Validate required fields
    if (!body.customer_name || !body.customer_phone || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    const result = await transaction(async (client) => {
      // Get product details and calculate totals
      let subtotal = 0
      const orderItems = []

      for (const item of body.items) {
        const productResult = await client.query(
          'SELECT id, name, price, stock, type FROM products WHERE id = $1 AND is_active = true',
          [item.product_id]
        )

        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`)
        }

        const product = productResult.rows[0]

        // Check stock for physical products
        if (product.type === 'physical' && product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`)
        }

        const itemSubtotal = product.price * item.quantity
        subtotal += itemSubtotal

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal
        })

        // Update stock for physical products
        if (product.type === 'physical') {
          await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [item.quantity, product.id]
          )
        }
      }

      // Apply promo code if provided
      let discountAmount = 0
      if (body.promo_code) {
        const promoResult = await client.query(
          `SELECT * FROM promo_codes 
           WHERE code = $1 AND is_active = true 
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (usage_limit IS NULL OR usage_count < usage_limit)`,
          [body.promo_code]
        )

        if (promoResult.rows.length > 0) {
          const promo = promoResult.rows[0]
          
          if (promo.discount_type === 'percentage') {
            discountAmount = (subtotal * promo.discount_value) / 100
            if (promo.max_discount && discountAmount > promo.max_discount) {
              discountAmount = promo.max_discount
            }
          } else {
            discountAmount = promo.discount_value
          }

          // Update promo usage
          await client.query(
            'UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1',
            [promo.id]
          )
        }
      }

      const totalAmount = subtotal - discountAmount

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone,
          status, subtotal, discount_amount, total_amount, promo_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          orderNumber,
          body.customer_name,
          body.customer_email,
          body.customer_phone,
          'pending',
          subtotal,
          discountAmount,
          totalAmount,
          body.promo_code
        ]
      )

      const order = orderResult.rows[0]

      // Create order items
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_price, quantity, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.product_id,
            item.product_name,
            item.product_price,
            item.quantity,
            item.subtotal
          ]
        )
      }

      return {
        order,
        items: orderItems
      }
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create order'
      },
      { status: 500 }
    )
  }
}
