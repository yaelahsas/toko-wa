import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize stats with default values
    let stats = {
      totalProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      todayRevenue: 0,
    };

    // Get total products
    try {
      const totalProductsResult = await query(
        'SELECT COUNT(*) as count FROM products'
      );
      stats.totalProducts = parseInt(totalProductsResult.rows[0].count);
    } catch (error) {
      console.error('Error fetching total products:', error);
    }

    // Get low stock products
    try {
      const lowStockResult = await query(
        'SELECT COUNT(*) as count FROM products WHERE stock < min_stock'
      );
      stats.lowStockProducts = parseInt(lowStockResult.rows[0].count);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }


    // Get total orders
    try {
      const totalOrdersResult = await query(
        'SELECT COUNT(*) as count FROM orders'
      );
      stats.totalOrders = parseInt(totalOrdersResult.rows[0].count);
    } catch (error) {
      console.error('Error fetching total orders:', error);
    }

    // Get pending orders
    try {
      const pendingOrdersResult = await query(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
      );
      stats.pendingOrders = parseInt(pendingOrdersResult.rows[0].count);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }

    // Get total revenue
    try {
      const totalRevenueResult = await query(
        'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != \'cancelled\''
      );
      stats.totalRevenue = parseFloat(totalRevenueResult.rows[0].total);
    } catch (error) {
      console.error('Error fetching total revenue:', error);
    }

    // Get today's revenue
    try {
      const todayRevenueResult = await query(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM orders 
         WHERE status != 'cancelled' 
         AND DATE(created_at) = CURRENT_DATE`
      );
      stats.todayRevenue = parseFloat(todayRevenueResult.rows[0].total);
    } catch (error) {
      console.error('Error fetching today revenue:', error);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
