import { query } from '../connection'

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  subtotal: number
  discount_amount: number
  total_amount: number
  promo_code?: string
  notes?: string
  created_at: Date
  updated_at: Date
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  product_image?: string
  product_type?: 'physical' | 'voucher'
  created_at: Date
}

interface OrderWithItems extends Order {
  items: OrderItem[]
}

export async function getOrders(
  page = 1,
  limit = 10,
  filters?: {
    status?: string
    search?: string
    startDate?: string
    endDate?: string
  }
) {
  const offset = (page - 1) * limit
  let whereClause = ''
  let countParams: any[] = []
  let queryParams: any[] = []
  let paramCount = 1

  // Build where clause based on filters
  if (filters) {
    const conditions = []
    
    if (filters.status && filters.status !== '') {
      conditions.push(`status = $${paramCount}`)
      countParams.push(filters.status)
      queryParams.push(filters.status)
      paramCount++
    }

    if (filters.search && filters.search !== '') {
      conditions.push(`(
        order_number ILIKE $${paramCount} OR 
        customer_name ILIKE $${paramCount} OR 
        customer_phone ILIKE $${paramCount}
      )`)
      countParams.push(`%${filters.search}%`)
      queryParams.push(`%${filters.search}%`)
      paramCount++
    }

    if (filters.startDate && filters.startDate !== '') {
      conditions.push(`created_at >= $${paramCount}`)
      countParams.push(filters.startDate)
      queryParams.push(filters.startDate)
      paramCount++
    }

    if (filters.endDate && filters.endDate !== '') {
      conditions.push(`created_at <= $${paramCount}`)
      countParams.push(filters.endDate)
      queryParams.push(filters.endDate)
      paramCount++
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ')
    }
  }

  // Get total count for pagination
  const countResult = await query(
    `SELECT COUNT(*) FROM orders ${whereClause}`,
    countParams
  )
  const total = parseInt(countResult.rows[0].count)

  // Add limit and offset to query params
  queryParams.push(limit, offset)

  // Get orders with pagination
  const result = await query(
    `SELECT * FROM orders 
    ${whereClause}
    ORDER BY created_at DESC 
    LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    queryParams
  )

  return {
    orders: result.rows,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit
    }
  }
}

export async function getOrderById(id: number): Promise<OrderWithItems | null> {
  const orderResult = await query(
    `SELECT * FROM orders WHERE id = $1`,
    [id]
  )

  if (orderResult.rows.length === 0) {
    return null
  }

  const order = orderResult.rows[0]

  const itemsResult = await query(
    `SELECT 
      oi.*,
      p.image_url as product_image,
      p.type as product_type
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE order_id = $1`,
    [id]
  )

  return {
    ...order,
    items: itemsResult.rows
  }
}

export async function updateOrderStatus(
  id: number, 
  status: string,
  notes?: string
) {
  const result = await query(
    `UPDATE orders 
    SET status = $1, notes = COALESCE($2, notes)
    WHERE id = $3
    RETURNING *`,
    [status, notes, id]
  )

  return result.rows[0]
}

export async function getOrderStatistics() {
  const result = await query(`
    SELECT
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as average_order_value
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `)

  return result.rows[0]
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const {
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    status,
    subtotal,
    discount_amount,
    total_amount,
    promo_code,
    notes
  } = orderData

  const result = await query(
    `INSERT INTO orders (
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      status,
      subtotal,
      discount_amount,
      total_amount,
      promo_code,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      status,
      subtotal,
      discount_amount,
      total_amount,
      promo_code,
      notes
    ]
  )

  return result.rows[0]
}
