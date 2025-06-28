import { NextRequest, NextResponse } from 'next/server'
import { getOrders, getOrderStatistics } from '@/lib/db/queries/orders'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    // Clean up empty string filters
    const filters = {
      status: status && status.trim() !== '' ? status : undefined,
      search: search && search.trim() !== '' ? search : undefined,
      startDate: startDate && startDate.trim() !== '' ? startDate : undefined,
      endDate: endDate && endDate.trim() !== '' ? endDate : undefined
    }

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await getOrders(page, limit, Object.keys(filters).length > 0 ? filters : undefined)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders' 
      },
      { status: 500 }
    )
  }
}
