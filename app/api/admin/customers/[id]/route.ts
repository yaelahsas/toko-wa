import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Get customer details with name from most recent order
    const customerResult = await query(
      `SELECT 
        c.*,
        o.customer_name
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = $1
      ORDER BY o.created_at DESC
      LIMIT 1`,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // Get customer's order history
    const ordersResult = await query(
      `SELECT 
        o.*,
        o.customer_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'product_price', oi.product_price,
              'subtotal', oi.subtotal
            )
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id, o.customer_name
      ORDER BY o.created_at DESC`,
      [customerId]
    );

    // Calculate customer statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders 
      WHERE customer_id = $1`,
      [customerId]
    );

    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        customer,
        orders: ordersResult.rows,
        stats: {
          total_orders: parseInt(stats.total_orders),
          total_spent: parseFloat(stats.total_spent),
          average_order_value: parseFloat(stats.average_order_value),
          completed_orders: parseInt(stats.completed_orders),
          pending_orders: parseInt(stats.pending_orders),
          cancelled_orders: parseInt(stats.cancelled_orders)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
