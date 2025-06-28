import { NextResponse } from 'next/server'
import { query } from '@/lib/db/connection'
import { getOrderStatistics } from '@/lib/db/queries/orders'

export async function GET() {
  try {
    // Get product stats
    const productStats = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock <= 5 AND type = 'physical' THEN 1 END) as low_stock_products
      FROM products
      WHERE is_active = true
    `)

    // Get order stats
    const orderStats = await getOrderStatistics()

    // Get today's revenue
    const todayRevenue = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as today_revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
      AND status != 'cancelled'
    `)

    const stats = {
      totalProducts: parseInt(productStats.rows[0].total_products),
      lowStockProducts: parseInt(productStats.rows[0].low_stock_products),
      totalOrders: parseInt(orderStats.total_orders),
      pendingOrders: parseInt(orderStats.pending_orders),
      totalRevenue: parseFloat(orderStats.total_revenue) || 0,
      todayRevenue: parseFloat(todayRevenue.rows[0].today_revenue) || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
