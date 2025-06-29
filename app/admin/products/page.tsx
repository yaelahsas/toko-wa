'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  stock: number;
  min_stock: number;
  category_name?: string;
  image?: string;
  is_active: boolean;
}

interface PaginationData {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(0, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load and pagination
  useEffect(() => {
    fetchProducts(pagination.offset, searchQuery);
  }, [pagination.offset]);

  const fetchProducts = async (offset: number, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          offset
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    setDeleteLoading(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh current page
        fetchProducts(pagination.offset, searchQuery);
      } else {
        alert('Gagal menghapus produk');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Terjadi kesalahan saat menghapus produk');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { label: 'Habis', variant: 'destructive' as const };
    } else if (stock <= minStock) {
      return { label: 'Menipis', variant: 'secondary' as const };
    }
    return { label: 'Tersedia', variant: 'default' as const };
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    }
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-gray-600">Kelola semua produk toko Anda</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari produk atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Produk</th>
                      <th className="text-left p-4">Kategori</th>
                      <th className="text-left p-4">Harga</th>
                      <th className="text-left p-4">Stok</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.stock, product.min_stock);
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image || '/placeholder.svg'}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-gray-600">{product.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{product.category_name || '-'}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">{formatPrice(product.price)}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span>{product.stock}</span>
                              {product.stock <= product.min_stock && (
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                disabled={deleteLoading === product.id}
                              >
                                {deleteLoading === product.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 px-4">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + products.length, pagination.total)} of {pagination.total} products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
