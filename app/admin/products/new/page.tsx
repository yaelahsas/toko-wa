'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'physical',
    price: '',
    original_price: '',
    description: '',
    images: [] as { url: string; is_primary: boolean; display_order?: number }[],
    category_id: '',
    stock: '',
    min_stock: '5',
    is_active: true,
  });

  // Remove any usage of imagePreview variable which is undefined

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Hanya file JPEG, PNG, dan WebP yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        // Add new image to images array
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { url: data.url, is_primary: prev.images.length === 0, display_order: prev.images.length }]
        }));
        setImagePreviews(prev => [...prev, data.url]);
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal upload gambar');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Terjadi kesalahan saat upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.url !== urlToRemove)
    }));
    setImagePreviews(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          stock: parseInt(formData.stock),
          min_stock: parseInt(formData.min_stock),
          images: formData.images, // ensure images array is sent
        }),
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        const error = await response.json();
        alert(error.error || 'Gagal menambah produk');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Terjadi kesalahan saat menambah produk');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-gray-600">Isi form di bawah untuk menambah produk baru</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Voucher Gaming Premium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipe Produk <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="physical">Produk Fisik</option>
                  <option value="voucher">Voucher Digital</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Kategori
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Deskripsi produk..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Gambar Produk
                </label>
                <div className="space-y-2">
                  {imagePreviews.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((url) => (
                        <div key={url} className="relative inline-block">
                          <img
                            src={url}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src="/placeholder.svg"
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium ${
                        uploading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Gambar
                        </>
                      )}
                    </label>
                    <span className="text-xs text-gray-500">
                      Max 5MB (JPEG, PNG, WebP)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Harga & Stok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Harga <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Harga Coret (Opsional)
                </label>
                <Input
                  type="number"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handleChange}
                  placeholder="75000"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan jika tidak ada diskon
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stok <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="100"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stok Minimum
                </label>
                <Input
                  type="number"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleChange}
                  placeholder="5"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Notifikasi akan muncul jika stok di bawah nilai ini
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Produk Aktif
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Produk
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
