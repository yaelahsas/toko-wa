'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "./components/status-badge"
import { Search, Filter, Eye, Calendar } from "lucide-react"
import Link from "next/link"

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    totalPages: number
    currentPage: number
    limit: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search.trim())
      }
      if (filters.status && filters.status !== '') {
        params.append('status', filters.status)
      }
      params.append('page', filters.page.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/admin/orders?${params}`)
      const result = await response.json()

      if (result.success) {
        setOrders(result.data.orders)
        setPagination(result.data.pagination)
      } else {
        console.error('Failed to fetch orders:', result.error)
        setOrders([])
        setPagination({
          total: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      setPagination({
        total: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari nomor pesanan, nama, atau telepon..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filters.status === '' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('')}
                size="sm"
              >
                Semua
              </Button>
              <Button
                variant={filters.status === 'pending' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('pending')}
                size="sm"
              >
                Menunggu
              </Button>
              <Button
                variant={filters.status === 'processing' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('processing')}
                size="sm"
              >
                Diproses
              </Button>
              <Button
                variant={filters.status === 'completed' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('completed')}
                size="sm"
              >
                Selesai
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pesanan ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat pesanan...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada pesanan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">#{order.order_number}</h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Pelanggan:</strong> {order.customer_name}</p>
                        <p><strong>Telepon:</strong> {order.customer_phone}</p>
                        <p><strong>Total:</strong> {formatCurrency(order.total_amount)}</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Sebelumnya
              </Button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? 'default' : 'outline'}
                  onClick={() => handlePageChange(page)}
                  size="sm"
                >
                  {page}
                </Button>
              ))}
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
