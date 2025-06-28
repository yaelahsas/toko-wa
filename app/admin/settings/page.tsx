'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface StoreSettings {
  id: number;
  store_name: string;
  slogan: string;
  logo_filename: string | null;
  admin_phone: string;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    slogan: '',
    admin_phone: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          store_name: data.store_name,
          slogan: data.slogan,
          admin_phone: data.admin_phone
        });
        if (data.logo_filename) {
          setLogoPreview(`/uploads/${data.logo_filename}`);
        }
      } else {
        toast.error('Gagal memuat pengaturan');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    setUploading(true);

    try {
      // Show loading toast
      const loadingToastId = toast.loading('Mengupload logo...');
      
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body: formData
      });

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (response.ok) {
        const data = await response.json();
        setLogoPreview(data.url);
        setSettings(data.settings);
        toast.success('Logo berhasil diupload! Logo baru akan terlihat di halaman toko.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Gagal upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Menghapus logo...');
      
      const response = await fetch('/api/admin/settings/logo', {
        method: 'DELETE'
      });

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (response.ok) {
        const data = await response.json();
        setLogoPreview(null);
        setSettings(data.settings);
        toast.success('Logo berhasil dihapus! Logo telah dihapus dari halaman toko.');
      } else {
        toast.error('Gagal menghapus logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Gagal menghapus logo');
    }
  };

  const handleSave = async () => {
    if (!formData.store_name || !formData.slogan || !formData.admin_phone) {
      toast.error('Semua field harus diisi');
      return;
    }

    setSaving(true);

    try {
      // Show loading toast
      const loadingToastId = toast.loading('Menyimpan pengaturan...');
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Pengaturan berhasil disimpan! Perubahan akan terlihat di halaman toko.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1>
        <p className="text-gray-600">Kelola informasi dasar toko Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
            <CardDescription>
              Atur nama toko, slogan, dan nomor admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Toko
              </label>
              <Input
                name="store_name"
                value={formData.store_name}
                onChange={handleInputChange}
                placeholder="Masukkan nama toko"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slogan
              </label>
              <Input
                name="slogan"
                value={formData.slogan}
                onChange={handleInputChange}
                placeholder="Masukkan slogan toko"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Admin (WhatsApp)
              </label>
              <Input
                name="admin_phone"
                value={formData.admin_phone}
                onChange={handleInputChange}
                placeholder="628123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 628123456789 (tanpa tanda +)
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Toko</CardTitle>
            <CardDescription>
              Upload logo toko (maksimal 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo toko"
                    className="w-full h-48 object-contain border rounded-lg bg-gray-50"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload-replace"
                    disabled={uploading}
                  />
                  <label htmlFor="logo-upload-replace">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Mengupload...' : 'Ganti Logo'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploading}
                />
                <label htmlFor="logo-upload">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {uploading ? 'Mengupload...' : 'Klik untuk upload logo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF, WebP (max 5MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
