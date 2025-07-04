import { Suspense } from 'react';
import VoucherStore from '@/components/voucher-store';
import { getProducts } from '@/lib/db/queries/products';
import { getCategories } from '@/lib/db/queries/categories';
import storeConfig from '../data/store-config.json';
import { ShoppingBag } from 'lucide-react';

async function getInitialData() {
  try {
    const [products, categories] = await Promise.all([
      getProducts(50), // Get first 50 products
      getCategories()
    ]);
    
    return { products, categories };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return { products: [], categories: [] };
  }
}

async function getStoreSettings() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/store/settings`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.storeInfo;
    }
  } catch (error) {
    console.error('Error fetching store settings:', error);
  }
  
  // Fallback to static config
  return storeConfig.storeInfo;
}

export default async function Page() {
  const { products, categories } = await getInitialData();
  const storeInfo = await getStoreSettings();
  const { voucherInfo, messages } = storeConfig;

  // Parse images property if it's a string
  const parsedProducts = products.map(product => {
    if (typeof product.images === 'string') {
      try {
        return { ...product, images: JSON.parse(product.images) };
      } catch {
        return { ...product, images: [] };
      }
    }
    return product;
  });
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VoucherStore 
        initialProducts={parsedProducts}
        categories={categories}
        storeInfo={storeInfo}
        voucherInfo={voucherInfo}
        messages={messages}
      />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 flex items-center justify-center">
      <div className="text-white text-center">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 animate-pulse" />
        <p>Memuat toko...</p>
      </div>
    </div>
  );
}
