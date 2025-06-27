import { Category } from '@/lib/db/queries/categories';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch categories');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
  try {
    const response = await fetch(`/api/categories/${slug}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch category');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
