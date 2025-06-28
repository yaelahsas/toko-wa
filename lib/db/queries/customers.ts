import { query } from '../connection'

export interface Customer {
  id: number
  phone_number: string
  order_count: number
  last_order_date: Date
  created_at: Date
  updated_at: Date
}

export async function getCustomers(
  limit = 20,
  offset = 0,
  search?: string
): Promise<{ customers: Customer[]; total: number }> {
  let sql = `
    SELECT 
      c.*,
      COUNT(*) OVER() as total_count
    FROM customers c
    WHERE 1=1
  `
  const params: any[] = []
  let paramCount = 1

  if (search) {
    sql += ` AND (c.phone_number ILIKE $${paramCount})`
    params.push(`%${search}%`)
    paramCount++
  }

  sql += ` ORDER BY c.last_order_date DESC`
  sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
  params.push(limit, offset)

  const result = await query(sql, params)
  const customers = result.rows
  const total = customers.length > 0 ? parseInt(customers[0].total_count) : 0

  return {
    customers: customers.map(c => ({
      ...c,
      total_count: undefined
    })),
    total
  }
}

export async function updateCustomerOrderCount(
  phone_number: string,
  client: any = null
): Promise<void> {
  const queryFn = client ? client.query.bind(client) : query

  // Check if customer exists
  const existingCustomer = await queryFn(
    'SELECT id FROM customers WHERE phone_number = $1',
    [phone_number]
  )

  if (existingCustomer.rows.length > 0) {
    // Update existing customer
    await queryFn(
      `UPDATE customers 
       SET order_count = order_count + 1,
           last_order_date = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [existingCustomer.rows[0].id]
    )
  } else {
    // Create new customer
    await queryFn(
      `INSERT INTO customers (
        phone_number,
        order_count,
        last_order_date,
        created_at,
        updated_at
      ) VALUES ($1, 1, NOW(), NOW(), NOW())`,
      [phone_number]
    )
  }
}
