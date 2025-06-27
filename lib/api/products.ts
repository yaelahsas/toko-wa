import { Product } from '@/lib/db/queries/products';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function fetchProducts(
  limit = 20,
  offset = 0,
  category?: string,
  search?: string
): Promise<ApiResponse<Product[]>> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const response = await fetch(`/api/products?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch products');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchProductBySlug(slug: string): Promise<ApiResponse<Product>> {
  try {
    const response = await fetch(`/api/products/${slug}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch product');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
