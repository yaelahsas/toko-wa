'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "../components/status-badge"
import { ArrowLeft, Package, User, Phone, Mail, Calendar, Edit } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: number
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  product_type: 'physical' | 'voucher'
}

interface OrderDetail {
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
  created_at: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setOrder(result.data)
      } else {
        console.error('Order not found')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setOrder(prev => prev ? { ...prev, status: newStatus as any } : null)
      } else {
        alert('Gagal mengupdate status pesanan')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Gagal mengupdate status pesanan')
    } finally {
      setUpdating(false)
    }
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Memuat detail pesanan...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Pesanan tidak ditemukan</p>
        <Link href="/admin/orders">
          <Button className="mt-4">Kembali ke Daftar Pesanan</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Detail Pesanan #{order.order_number}</h1>
          <p className="text-gray-600">Dibuat pada {formatDate(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.product_type === 'voucher' ? '🎫 Voucher' : '📦 Produk Fisik'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.product_price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon {order.promo_code && `(${order.promo_code})`}:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <StatusBadge status={order.status} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Update Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={order.status === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateOrderStatus('pending')}
                    disabled={updating || order.status === 'pending'}
                  >
                    Menunggu
                  </Button>
                  <Button
                    variant={order.status === 'processing' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateOrderStatus('processing')}
                    disabled={updating || order.status === 'processing'}
                  >
                    Diproses
                  </Button>
                  <Button
                    variant={order.status === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateOrderStatus('completed')}
                    disabled={updating || order.status === 'completed'}
                  >
                    Selesai
                  </Button>
                  <Button
                    variant={order.status === 'cancelled' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateOrderStatus('cancelled')}
                    disabled={updating || order.status === 'cancelled'}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{order.customer_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(order.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
