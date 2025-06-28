'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CustomerDetails {
  customer: {
    id: number;
    phone_number: string;
    customer_name: string;
    order_count: number;
    last_order_date: string;
    created_at: string;
  };
  orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    status: string;
    total_amount: number;
    created_at: string;
    items: Array<{
      id: number;
      product_name: string;
      quantity: number;
      product_price: number;
      subtotal: number;
    }>;
  }>;
  stats: {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, []);

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerLevel = (orderCount: number) => {
    if (orderCount >= 10) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    if (orderCount >= 7) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (orderCount >= 4) return { label: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Failed to load customer details'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const customerLevel = getCustomerLevel(data.customer.order_count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/customers">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.customer.customer_name || 'Detail Pelanggan'}
            </h1>
            <p className="text-gray-600">Nomor Telepon: {data.customer.phone_number}</p>
          </div>
        </div>
        <Badge className={customerLevel.color}>
          {customerLevel.label}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pesanan
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pembelian
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.total_spent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata Pembelian
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.average_order_value)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nama Pelanggan</p>
              <p className="mt-1 font-medium">{data.customer.customer_name || 'Tidak tersedia'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bergabung Sejak</p>
              <p className="mt-1">{formatDate(data.customer.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pesanan Terakhir</p>
              <p className="mt-1">{formatDate(data.customer.last_order_date)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Pesanan Selesai</p>
              <p className="mt-1 text-green-600">{data.stats.completed_orders}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pesanan Pending</p>
              <p className="mt-1 text-yellow-600">{data.stats.pending_orders}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pesanan Dibatalkan</p>
              <p className="mt-1 text-red-600">{data.stats.cancelled_orders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-green-600 hover:text-green-700"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    <p className="text-sm font-medium text-gray-700">Pelanggan: {order.customer_name}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-500">Items:</p>
                  <ul className="mt-1 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        {item.product_name} ({item.quantity}x) - {formatCurrency(item.subtotal)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 text-right">
                    <p className="font-medium">
                      Total: {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
