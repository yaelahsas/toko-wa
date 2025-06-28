'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  Package,
  Ticket,
  Trash2,
  Minus,
  Plus,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import storeConfig from '../../data/store-config.json';
import { Product } from '@/lib/db/queries/products';

export default function ConfirmationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoId, setPromoId] = useState<number | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const { storeInfo, formLabels, messages } = storeConfig;
  const minPurchase = storeInfo.minPurchase;

  // Load cart from localStorage and fetch products from database
  useEffect(() => {
    const loadCartAndProducts = async () => {
      try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);

          // If cart is empty, redirect to home
          if (Object.keys(parsedCart).length === 0) {
            router.replace('/');
            return;
          }

          // Fetch products from database for items in cart
          const productIds = Object.keys(parsedCart);
          const productPromises = productIds.map(id => 
            fetch(`/api/products/${id}`).then(res => res.json())
          );
          
          const responses = await Promise.all(productPromises);
          const fetchedProducts = responses
            .filter(res => res.success && res.data)
            .map(res => res.data);
          
          setProducts(fetchedProducts);
        } else {
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('Error loading cart or products:', error);
        router.replace('/');
        return;
      } finally {
        setIsLoadingProducts(false);
        setIsLoaded(true);
      }
    };

    loadCartAndProducts();
  }, [router]);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));

        // If cart becomes empty, redirect to home
        if (Object.keys(cart).length === 0) {
          setTimeout(() => {
            router.replace('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isLoaded, router]);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id.toString() === id);
    return sum + (product?.price || 0) * qty;
  }, 0);
  const totalPrice = subtotal - promoDiscount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id.toString() === productId);
    
    if (!product) return;
    
    // Check stock availability for physical products
    if (product.type === 'physical' && newQuantity > product.stock) {
      alert(`Stok tidak cukup! Maksimal ${product.stock} item untuk ${product.name}`);
      return;
    }
    
    setCart((prev) => {
      const newCart = { ...prev };
      if (newQuantity <= 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = newQuantity;
      }
      return newCart;
    });
  };

  const removeItem = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoMessage('Masukkan kode promo');
      return;
    }

    setIsValidatingPromo(true);
    setPromoMessage('');

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode,
          totalAmount: subtotal,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPromoDiscount(data.data.discountAmount);
        setPromoMessage(data.data.message);
        setPromoId(data.data.promoId);
      } else {
        setPromoDiscount(0);
        setPromoMessage(data.error || 'Kode promo tidak valid');
        setPromoId(null);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoMessage('Terjadi kesalahan saat validasi kode promo');
      setPromoDiscount(0);
      setPromoId(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoMessage('');
    setPromoId(null);
  };

  const sendToWhatsApp = async () => {
    if (!name || !email || !phone) {
      alert('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    if (totalItems < minPurchase) {
      alert(`Minimal pembelian ${minPurchase} item`);
      return;
    }

    // Final stock validation before checkout
    const stockErrors: string[] = [];
    Object.entries(cart).forEach(([id, qty]) => {
      const product = products.find((p) => p.id.toString() === id);
      if (product && product.type === 'physical' && qty > product.stock) {
        stockErrors.push(`${product.name}: maksimal ${product.stock} item (diminta ${qty})`);
      }
    });

    if (stockErrors.length > 0) {
      alert(`Stok tidak mencukupi:\n\n${stockErrors.join('\n')}\n\nSilakan sesuaikan jumlah pesanan.`);
      return;
    }

    try {
      // Create order in database first
      const orderItems = Object.entries(cart).map(([productId, quantity]) => ({
        product_id: parseInt(productId),
        quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim(),
          promo_code: promoCode.trim() || undefined,
          items: orderItems,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(`Gagal membuat pesanan: ${result.error || 'Unknown error'}`);
        return;
      }

      // Order created successfully, now send WhatsApp message
      const orderDetails = Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((p) => p.id.toString() === id);
          return `${product?.name} x${qty} = ${formatPrice(
            (product?.price || 0) * qty
          )}`;
        })
        .join('\n');

      // Build message with promo info if applicable
      let messageText = messages.orderMessage
        .replace('{orderDetails}', orderDetails);
      
      // Add promo code info if discount is applied
      if (promoDiscount > 0) {
        const promoInfo = `\n\nSubtotal: ${formatPrice(subtotal)}\nKode Promo (${promoCode}): -${formatPrice(promoDiscount)}\n`;
        messageText = messageText.replace('{total}', `${promoInfo}*Total: ${formatPrice(totalPrice)}*`);
      } else {
        messageText = messageText.replace('{total}', formatPrice(totalPrice));
      }
      
      const message = messageText
        .replace('{name}', name)
        .replace('{email}', email)
        .replace('{phone}', phone);

      const whatsappUrl = `https://wa.me/${
        storeInfo.whatsappNumber
      }?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      // Clear cart after successful order
      localStorage.removeItem('cart');
      setCart({});
      
      alert('Pesanan berhasil dibuat! Stok telah dikurangi.');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.');
    }
  };


  const goBack = () => {
    router.push('/');
  };

  // Loading state
  if (!isLoaded || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 flex items-center justify-center">
        <div className="text-white text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 flex items-center justify-center">
        <Card className="mx-4 max-w-md">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-4">
              Semua item telah dihapus. Kembali untuk berbelanja lagi.
            </p>
            <Button
              onClick={goBack}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Kembali Belanja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="text-white hover:bg-white/20 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">
                Konfirmasi Pesanan
              </h1>
              <p className="text-white/80 text-sm">
                Review & checkout pesanan Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md pb-32">
        {/* Order Summary */}
        <Card className="mb-6 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              Ringkasan Pesanan
              <Badge variant="secondary" className="ml-auto">
                {totalItems} item
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(cart).map(([id, qty]) => {
              const product = products.find((p) => p.id.toString() === id);
              if (!product) return null;

              const primaryImage = Array.isArray(product.images) && product.images.length > 0
                ? product.images.find(img => img.is_primary)?.url || product.images[0]?.url
                : '/placeholder.svg';

              return (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <img
                    src={primaryImage || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      {product.type === 'voucher' ? (
                        <Ticket className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Package className="w-4 h-4 text-green-500" />
                      )}
                      {product.type === 'physical' && product.stock <= 10 && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                          Stok: {product.stock}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(id, qty - 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {qty}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(id, qty + 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-emerald-700">
                          {formatPrice(product.price * qty)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(id)}
                          className="w-6 h-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="border-t pt-4 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Promo Discount */}
              {promoDiscount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Diskon Promo:</span>
                  <span>-{formatPrice(promoDiscount)}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-xl text-emerald-700">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {totalItems} item • Sudah termasuk pajak
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Section */}
        <Card className="mb-6 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              Kode Promo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!promoDiscount ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Masukkan kode promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1"
                    disabled={isValidatingPromo}
                  />
                  <Button
                    onClick={validatePromoCode}
                    disabled={isValidatingPromo || !promoCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isValidatingPromo ? 'Validasi...' : 'Gunakan'}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-green-800">
                        Kode: {promoCode}
                      </p>
                      <p className="text-sm text-green-600">
                        Diskon: {formatPrice(promoDiscount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={removePromoCode}
                      className="text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              )}
              
              {promoMessage && (
                <p className={`text-sm ${promoDiscount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {promoMessage}
                </p>
              )}

              {/* Available Promo Codes Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Kode promo tersedia:</p>
                <ul className="list-disc list-inside">
                  <li>WELCOME10 - Diskon 10% (min. Rp 50.000)</li>
                  <li>HEMAT20K - Potongan Rp 20.000 (min. Rp 100.000)</li>
                  <li>RAMADAN15 - Diskon 15% (min. Rp 75.000)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minimum Purchase Warning */}
        {totalItems < minPurchase && (
          <div className="bg-amber-500 text-white p-3 rounded-lg mb-6 text-center font-medium">
            ⚠️ Minimal pembelian {minPurchase} item. Tambah{' '}
            {minPurchase - totalItems} item lagi atau kembali ke halaman utama.
          </div>
        )}

        {/* Customer Information Form */}
        <Card className="mb-10 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>📝 Data Pemesan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formLabels.name}
              </label>
              <Input
                type="text"
                placeholder={formLabels.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formLabels.email}
              </label>
              <Input
                type="email"
                placeholder={formLabels.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formLabels.phone}
              </label>
              <Input
                type="tel"
                placeholder={formLabels.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full"
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Footer - Checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-md">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-lg font-bold text-gray-900">
                Total: {formatPrice(totalPrice)}
              </div>
              <div className="text-sm text-gray-600">{totalItems} item</div>
            </div>
            <div className="text-right">
              {totalItems < minPurchase ? (
                <Badge variant="destructive" className="text-xs">
                  Kurang {minPurchase - totalItems} item
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm">
                  Siap Checkout
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={sendToWhatsApp}
            disabled={!name || !email || !phone || totalItems < minPurchase}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium rounded-lg disabled:bg-gray-400"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {messages.checkoutButton}
          </Button>

          {(!name || !email || !phone || totalItems < minPurchase) && (
            <p className="text-xs text-gray-500 text-center mt-2">
              {totalItems < minPurchase
                ? `Tambah ${minPurchase - totalItems} item lagi untuk checkout`
                : 'Lengkapi semua data untuk melanjutkan'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
