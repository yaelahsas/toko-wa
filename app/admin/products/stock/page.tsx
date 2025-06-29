'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, AlertCircle, ArrowUp, ArrowDown, Search, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<{ [key: number]: string }>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: sortField,
        order: sortOrder,
        search: debouncedSearch
      });

      const response = await fetch(`/api/products/stock/paginated?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    } else if (stock <= minStock) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />;
  };

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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                Name {renderSortIcon('name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort('category')}
              >
                Category {renderSortIcon('category')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort('stock')}
              >
                Stock {renderSortIcon('stock')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Adjust Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const stockStatus = getStockStatus(product.stock, product.min_stock);
                const itemNumber = (page - 1) * 10 + index + 1;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{itemNumber}. {product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_name || 'No category'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      {product.stock <= product.min_stock && (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-1 rounded-lg text-xs mt-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Below minimum stock ({product.min_stock})</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 max-w-xs">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={adjustmentAmounts[product.id] || ''}
                        onChange={(e) => setAdjustmentAmounts(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-20"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = parseInt(adjustmentAmounts[product.id] || '0');
                          handleStockAdjustment(product.id, amount);
                          setAdjustmentAmounts(prev => ({ ...prev, [product.id]: '' }));
                        }}
                        disabled={adjusting === product.id || !adjustmentAmounts[product.id]}
                        className="flex-1 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
                      >
                        <ArrowUp className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = parseInt(adjustmentAmounts[product.id] || '0');
                          handleStockAdjustment(product.id, -amount);
                          setAdjustmentAmounts(prev => ({ ...prev, [product.id]: '' }));
                        }}
                        disabled={adjusting === product.id || !adjustmentAmounts[product.id] || parseInt(adjustmentAmounts[product.id] || '0') > product.stock}
                        className="flex-1 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200"
                      >
                        <ArrowDown className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {products.length > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>

          {(() => {
            const pageButtons = [];
            const maxButtons = 5;
            let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
            let endPage = startPage + maxButtons - 1;

            if (endPage > totalPages) {
              endPage = totalPages;
              startPage = Math.max(1, endPage - maxButtons + 1);
            }

            if (startPage > 1) {
              pageButtons.push(
                <Button
                  key={1}
                  variant={1 === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={loading}
                  className={1 === page ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  1
                </Button>
              );
              if (startPage > 2) {
                pageButtons.push(
                  <span key="start-ellipsis" className="flex items-center px-2 text-gray-500 select-none">
                    ...
                  </span>
                );
              }
            }

            for (let i = startPage; i <= endPage; i++) {
              pageButtons.push(
                <Button
                  key={i}
                  variant={i === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(i)}
                  disabled={loading}
                  className={i === page ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {i}
                </Button>
              );
            }

            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pageButtons.push(
                  <span key="end-ellipsis" className="flex items-center px-2 text-gray-500 select-none">
                    ...
                  </span>
                );
              }
              pageButtons.push(
                <Button
                  key={totalPages}
                  variant={totalPages === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={loading}
                  className={totalPages === page ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {totalPages}
                </Button>
              );
            }

            return pageButtons;
          })()}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
