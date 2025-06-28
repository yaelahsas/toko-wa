# Admin Orders Management - Dokumentasi

## Overview
Fitur Admin Orders Management telah berhasil diimplementasikan untuk mengelola pesanan pelanggan di Toko Serbaguna. Fitur ini mencakup:

- ✅ Daftar semua pesanan dengan filtering dan pagination
- ✅ Detail pesanan lengkap dengan informasi pelanggan dan items
- ✅ Update status pesanan (pending, processing, completed, cancelled)
- ✅ Integrasi dengan dashboard untuk statistik
- ✅ API endpoints untuk frontend dan integrasi WhatsApp

## File Structure

```
app/admin/orders/
├── page.tsx                    # Halaman utama daftar orders
├── loading.tsx                 # Loading state
├── [id]/
│   └── page.tsx               # Halaman detail order
└── components/
    └── status-badge.tsx       # Komponen badge status

app/api/admin/orders/
├── route.ts                   # API list orders (GET)
└── [id]/
    └── route.ts              # API detail & update order (GET, PATCH)

app/api/orders/
└── route.ts                  # API create order (POST) - untuk frontend

lib/db/queries/
└── orders.ts                 # Database queries untuk orders

scripts/
└── add-sample-orders.sql     # Sample data untuk testing
```

## Database Schema

### Table: orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  promo_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: order_items
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. GET /api/admin/orders
**Deskripsi:** Mengambil daftar pesanan dengan filtering dan pagination

**Query Parameters:**
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah per halaman (default: 10)
- `status` (optional): Filter status (pending, processing, completed, cancelled)
- `search` (optional): Pencarian berdasarkan order number, nama, atau telepon
- `startDate` (optional): Filter tanggal mulai
- `endDate` (optional): Filter tanggal akhir

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "total": 25,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### 2. GET /api/admin/orders/[id]
**Deskripsi:** Mengambil detail pesanan beserta items

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-1704067200-ABC12",
    "customer_name": "Budi Santoso",
    "status": "pending",
    "total_amount": 125000,
    "items": [...]
  }
}
```

### 3. PATCH /api/admin/orders/[id]
**Deskripsi:** Update status pesanan

**Request Body:**
```json
{
  "status": "processing",
  "notes": "Pesanan sedang diproses"
}
```

### 4. POST /api/orders
**Deskripsi:** Membuat pesanan baru (untuk integrasi frontend)

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@email.com",
  "customer_phone": "081234567890",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "promo_code": "DISKON10"
}
```

## Fitur-fitur

### 1. Halaman Daftar Orders (/admin/orders)
- **Filtering:** Status, pencarian, tanggal
- **Pagination:** 10 orders per halaman
- **Informasi:** Order number, customer, status, total, tanggal
- **Actions:** View detail

### 2. Halaman Detail Order (/admin/orders/[id])
- **Informasi Customer:** Nama, email, telepon, tanggal order
- **Items:** Daftar produk dengan harga dan quantity
- **Summary:** Subtotal, diskon, total
- **Status Management:** Update status dengan tombol
- **Notes:** Catatan tambahan

### 3. Dashboard Integration
- **Statistics:** Total orders, pending orders, revenue
- **Quick Actions:** Link ke halaman orders

## Status Order

1. **pending** - Pesanan baru, menunggu konfirmasi
2. **processing** - Pesanan sedang diproses
3. **completed** - Pesanan selesai
4. **cancelled** - Pesanan dibatalkan

## Testing

### 1. Setup Sample Data
```bash
# Jalankan script untuk menambah sample orders
psql -U toko_user -d toko_wa -f scripts/add-sample-orders.sql
```

### 2. Test Scenarios
- ✅ View orders list dengan berbagai filter
- ✅ Pagination orders
- ✅ View order detail
- ✅ Update order status
- ✅ Dashboard statistics
- ✅ Create new order via API

## Integration dengan WhatsApp

Order baru dapat dibuat melalui API `/api/orders` yang akan:
1. Validasi produk dan stok
2. Hitung total dengan promo code
3. Update stok produk fisik
4. Simpan order dan items ke database
5. Return order details untuk WhatsApp message

## Next Steps

Fitur yang bisa dikembangkan selanjutnya:
1. **Email Notifications** - Kirim email konfirmasi ke customer
2. **Order History** - Riwayat perubahan status
3. **Bulk Actions** - Update multiple orders sekaligus
4. **Export Orders** - Export ke Excel/PDF
5. **Advanced Filtering** - Filter berdasarkan produk, revenue range
6. **Order Analytics** - Grafik penjualan, top products

## Troubleshooting

### Common Issues:
1. **Orders tidak muncul:** Pastikan database migration sudah dijalankan
2. **Status tidak bisa diupdate:** Check API endpoint dan permissions
3. **Sample data error:** Pastikan products table sudah ada data

### Database Queries untuk Debug:
```sql
-- Check orders count
SELECT COUNT(*) FROM orders;

-- Check order items
SELECT o.order_number, oi.product_name, oi.quantity 
FROM orders o 
JOIN order_items oi ON o.id = oi.order_id;

-- Check order statistics
SELECT status, COUNT(*) FROM orders GROUP BY status;
