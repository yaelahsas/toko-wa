'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  Info,
  Search,
  X,
  Filter,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/db/queries/products';
import { Category } from '@/lib/db/queries/categories';
import { useWishlist } from '@/hooks/use-wishlist';
import { Carousel } from '@/components/ui/carousel';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

interface VoucherStoreProps {
  initialProducts: Product[];
  categories: Category[];
  storeInfo: {
    name: string;
    tagline: string;
    whatsappNumber: string;
    minPurchase: number;
  };
  voucherInfo: {
    title: string;
    details: string[];
  };
  messages: {
    minPurchaseWarning: string;
    checkoutButton: string;
    orderMessage: string;
  };
}

export default function VoucherStore({
  initialProducts,
  categories,
  storeInfo,
  voucherInfo,
  messages,
}: VoucherStoreProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [products] = useState(initialProducts);
  const router = useRouter();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const minPurchase = storeInfo.minPurchase;
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id.toString() === id);
    return sum + (product?.price || 0) * qty;
  }, 0);

  // Load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isLoaded]);

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (product) => product.category_id === parseInt(selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId);
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    
    if (product) {
      toast.success(`${product.name} ditambahkan ke keranjang`, {
        description: `Total: ${cart[productId] ? cart[productId] + 1 : 1} item`,
      });
    }
  };

  const removeFromCart = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId);
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
        if (product) {
          toast.info(`${product.name} dikurangi dari keranjang`, {
            description: `Sisa: ${newCart[productId]} item`,
          });
        }
      } else {
        delete newCart[productId];
        if (product) {
          toast.info(`${product.name} dihapus dari keranjang`);
        }
      }
      return newCart;
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const proceedToCheckout = () => {
    if (totalItems < minPurchase) {
      toast.error(`Minimal pembelian ${minPurchase} item`, {
        description: `Tambahkan ${minPurchase - totalItems} item lagi untuk melanjutkan`,
      });
      return;
    }

    // Show loading toast with ID so we can dismiss it later
    const toastId = toast.loading('Memproses pesanan...');
    
    // Navigate to confirmation page
    router.push('/confirmation');
    
    // Dismiss the loading toast after navigation starts
    setTimeout(() => {
      toast.dismiss(toastId);
    }, 1000);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Don't render until cart is loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 flex items-center justify-center">
        <div className="text-white text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm border-b border-white/20 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShoppingBag className="w-6 h-6 text-yellow-200 dark:text-yellow-400" />
                <h1 className="text-xl font-bold text-white">{storeInfo.name}</h1>
              </div>
              <p className="text-white/90 text-sm">{storeInfo.tagline}</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari produk atau voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 bg-white/90 backdrop-blur-sm border-white/40 focus:bg-white"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Counter */}
      <div className="fixed top-32 right-4 z-40">
        <Card className="bg-white/95 backdrop-blur-sm border-white/40 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium">{totalItems}</span>
              <Badge variant="secondary" className="text-xs">
                {formatPrice(totalPrice)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with padding for sticky elements */}
      <div className="container mx-auto px-4 py-6 max-w-md pb-40">
        {/* Category Filter Toggle Button */}
        <div className="mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className="bg-white/20 text-white border-white/40 hover:bg-white/30 mb-3"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter Kategori
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {categories.find(c => c.id.toString() === selectedCategory)?.name || 'Semua'}
              </Badge>
            )}
          </Button>

          {/* Category Filter Options - Only show when toggle is active */}
          {showCategoryFilter && (
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-200">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedCategory('all');
                  setShowCategoryFilter(false);
                }}
                className={
                  selectedCategory === 'all'
                    ? 'bg-white text-emerald-700 hover:bg-white/90'
                    : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                }
              >
                Semua Produk
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedCategory(category.id.toString());
                    setShowCategoryFilter(false);
                  }}
                  className={
                    selectedCategory === category.id.toString()
                      ? 'bg-white text-emerald-700 hover:bg-white/90'
                      : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                  }
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                  {category.product_count && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {category.product_count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4 text-center">
            <p className="text-white/90 text-sm">
              {filteredProducts.length > 0
                ? `Ditemukan ${filteredProducts.length} produk untuk "${searchQuery}"`
                : `Tidak ada produk yang ditemukan untuk "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Voucher Information - Only show when not searching */}
        {!searchQuery && (
          <Card className="mb-6 bg-white/25 dark:bg-gray-800/50 backdrop-blur-sm border-white/40 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-white dark:text-gray-200" />
                <h2 className="text-white dark:text-gray-200 font-semibold text-lg">
                  {voucherInfo.title}
                </h2>
              </div>
              <div className="space-y-2 text-white/90 dark:text-gray-300">
                {voucherInfo.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-300 dark:text-green-400">✓</span>
                    <span>{detail}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-green-300 dark:text-green-400">✓</span>
                  <span>Minimal pembelian: {minPurchase} item</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Minimum Purchase Warning */}
        {totalItems < minPurchase && totalItems > 0 && (
          <div className="bg-amber-500 text-white p-3 rounded-lg mb-6 text-center font-medium">
            {messages.minPurchaseWarning.replace(
              '{min}',
              minPurchase.toString()
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {filteredProducts.map((product) => {
              const productId = product.id.toString();
              
              // Get all product images
              const productImages = Array.isArray(product.images) && product.images.length > 0
                ? product.images
                    .sort((a, b) => {
                      // Primary image first
                      if (a.is_primary && !b.is_primary) return -1;
                      if (!a.is_primary && b.is_primary) return 1;
                      return 0;
                    })
                    .map(img => img.url)
                : ['/placeholder.svg'];

              return (
                <Card
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="relative">
                    <Carousel
                      images={productImages}
                      className="w-full h-32 object-cover"
                    />

                    {product.type && (
                      <Badge className="absolute top-2 left-2 bg-blue-500">
                        {product.type}
                      </Badge>
                    )}
                    
                    {/* Wishlist Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWishlist(productId, product.name)}
                      className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white rounded-full"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isInWishlist(productId)
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-600'
                        }`}
                      />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-emerald-700">
                          {formatPrice(product.price)}
                        </div>
                        {product.original_price && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(product.original_price)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(productId)}
                          disabled={!cart[productId]}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {cart[productId] || 0}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(productId)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <h3 className="text-white font-semibold text-lg mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-white/80 mb-4">
              Coba kata kunci lain atau lihat semua produk
            </p>
            <Button onClick={clearSearch} variant="secondary">
              Lihat Semua Produk
            </Button>
          </div>
        ) : null}
      </div>

      {/* Sticky Footer - Proceed to Checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900">
                Total: {formatPrice(totalPrice)}
              </div>
              <div className="text-sm text-gray-600">({totalItems} item)</div>
            </div>
            <div className="text-right">
              {totalItems < minPurchase && totalItems > 0 && (
                <div className="text-xs text-amber-600 mb-1">
                  Kurang {minPurchase - totalItems} item lagi
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={proceedToCheckout}
            disabled={totalItems < minPurchase}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium rounded-lg disabled:bg-gray-400"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            {totalItems === 0 ? 'Pilih Produk Dulu' : 'LANJUT KE CHECKOUT'}
          </Button>
        </div>
      </div>
    </div>
  );
}
