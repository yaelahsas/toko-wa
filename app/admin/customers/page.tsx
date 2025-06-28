'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Phone, Calendar, ShoppingBag, Users } from "lucide-react"

interface Customer {
  id: number
  phone_number: string
  order_count: number
  last_order_date: string
  created_at: string
  updated_at: string
}

interface CustomersResponse {
  customers: Customer[]
  pagination: {
    total: number
    totalPages: number
    currentPage: number
    limit: number
    offset: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
    offset: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    page: 1
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search.trim())
      }
      params.append('offset', ((filters.page - 1) * 20).toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/customers?${params}`)
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data.customers)
        setPagination(result.data.pagination)
      } else {
        console.error('Failed to fetch customers:', result.error)
        setCustomers([])
        setPagination({
          total: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 20,
          offset: 0
        })
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setPagination({
        total: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 20,
        offset: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [filters])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
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

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 20) return { level: 'VIP', color: 'text-purple-600 bg-purple-100' }
    if (orderCount >= 10) return { level: 'Gold', color: 'text-yellow-600 bg-yellow-100' }
    if (orderCount >= 5) return { level: 'Silver', color: 'text-gray-600 bg-gray-100' }
    return { level: 'Bronze', color: 'text-orange-600 bg-orange-100' }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Pelanggan</h1>
          <p className="text-gray-600">Kelola data pelanggan berdasarkan nomor telepon</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pelanggan</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pelanggan VIP</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.order_count >= 20).length}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pelanggan Aktif</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => {
                    const lastOrder = new Date(c.last_order_date)
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                    return lastOrder > thirtyDaysAgo
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari nomor telepon..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data pelanggan...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada data pelanggan ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => {
                const customerLevel = getCustomerLevel(customer.order_count)
                return (
                  <div
                    key={customer.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-lg">{customer.phone_number}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${customerLevel.color}`}>
                            {customerLevel.level}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <ShoppingBag className="h-4 w-4" />
                              <span><strong>Total Pesanan:</strong> {customer.order_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span><strong>Pesanan Terakhir:</strong> {formatDate(customer.last_order_date)}</span>
                            </div>
                          </div>
                          <p><strong>Bergabung:</strong> {formatDate(customer.created_at)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                        className="mt-2"
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                )
              })}
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
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let page
                if (pagination.totalPages <= 5) {
                  page = i + 1
                } else if (pagination.currentPage <= 3) {
                  page = i + 1
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i
                } else {
                  page = pagination.currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={page}
                    variant={page === pagination.currentPage ? 'default' : 'outline'}
                    onClick={() => handlePageChange(page)}
                    size="sm"
                  >
                    {page}
                  </Button>
                )
              })}
              
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
