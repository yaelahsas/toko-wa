'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, AlertCircle, ArrowUp, ArrowDown, Search } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  category_name?: string;
  image?: string;
}

export default function StockManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (productId: number, adjustment: number) => {
    if (!adjustment) return;

    setAdjusting(productId);
    try {
      const operation = adjustment > 0 ? 'add' : 'subtract';
      const quantity = Math.abs(adjustment);

      const response = await fetch(`/api/products/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
          operation,
        }),
      });

      if (response.ok) {
        // Update local state
        setProducts(products.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              stock: product.stock + adjustment,
            };
          }
          return product;
        }));
        setAdjustmentAmount('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error adjusting stock');
    } finally {
      setAdjusting(null);
    }
  };


  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    } else if (stock <= minStock) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };


  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <Link href="/admin/products">
          <Button variant="outline">
            View All Products
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
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock, product.min_stock);
          return (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {product.image && product.image !== '/placeholder.svg' ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <p className="text-sm text-gray-500">{product.category_name || 'No category'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-2xl font-bold">{product.stock}</p>
                    </div>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </div>

                  {product.stock <= product.min_stock && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Below minimum stock ({product.min_stock})</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="w-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStockAdjustment(product.id, parseInt(adjustmentAmount))}
                      disabled={adjusting === product.id || !adjustmentAmount}
                      className="flex-1"
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStockAdjustment(product.id, -parseInt(adjustmentAmount))}
                      disabled={adjusting === product.id || !adjustmentAmount || parseInt(adjustmentAmount) > product.stock}
                      className="flex-1"
                    >
                      <ArrowDown className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No products found</p>
        </div>
      )}
    </div>
  );
}
