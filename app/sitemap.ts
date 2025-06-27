import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/db/queries/products';
import { getCategories } from '@/lib/db/queries/categories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Get all products and categories for dynamic routes
    const products = await getProducts();
    const categories = await getCategories();
    
    // Static pages
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/confirmation`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
    ];
    
    // Product pages (if you have individual product pages in the future)
    const productPages = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.updated_at || product.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    
    // Category pages (if you have category pages in the future)
    const categoryPages = categories.map((category) => ({
      url: `${baseUrl}/category/${category.id}`,
      lastModified: new Date(category.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    
    // For now, just return static pages since we don't have individual product/category pages yet
    return [...staticPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least the static pages if there's an error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ];
  }
}
