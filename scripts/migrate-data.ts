import { query } from '../lib/db/connection';
import storeConfig from '../data/store-config.json';

async function migrateData() {
  console.log('🚀 Starting data migration...');
  
  try {
    // First, let's check if we already have data
    const existingProducts = await query('SELECT COUNT(*) as count FROM products');
    if (parseInt(existingProducts.rows[0].count) > 0) {
      console.log('⚠️  Database already has products. Skipping migration.');
      return;
    }

    // Get or create category for existing products
    let categoryId = 1; // Default to first category
    
    // Check if we have categories
    const categories = await query('SELECT id, slug FROM categories');
    if (categories.rows.length === 0) {
      // Create default categories if none exist
      console.log('📁 Creating default categories...');
      await query(`
        INSERT INTO categories (name, slug, icon, display_order) VALUES
        ('Sembako', 'sembako', '🛒', 1),
        ('Voucher', 'voucher', '🎫', 2),
        ('Fashion', 'fashion', '👕', 3),
        ('Elektronik', 'elektronik', '📱', 4)
      `);
    }
    
    // Get voucher category ID
    const voucherCategory = await query("SELECT id FROM categories WHERE slug = 'voucher'");
    const fashionCategory = await query("SELECT id FROM categories WHERE slug = 'fashion'");
    const voucherId = voucherCategory.rows[0]?.id || 2;
    const fashionId = fashionCategory.rows[0]?.id || 3;

    // Migrate products
    console.log('📦 Migrating products...');
    for (const product of storeConfig.products) {
      // Determine category based on product type or name
      let productCategoryId = categoryId;
      if (product.type === 'voucher') {
        productCategoryId = voucherId;
      } else if (product.name.toLowerCase().includes('kaos') || product.name.toLowerCase().includes('sepatu')) {
        productCategoryId = fashionId;
      }

      // Generate slug from name
      const slug = product.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Insert product
      const result = await query(
        `INSERT INTO products (category_id, name, slug, description, price, original_price, type, stock, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          productCategoryId,
          product.name,
          slug,
          product.description,
          product.price,
          product.originalPrice || null,
          product.type || 'physical',
          100, // Default stock
          true
        ]
      );

      const productId = result.rows[0].id;

      // Insert product image
      if (product.image) {
        await query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [productId, product.image, true, 0]
        );
      }

      console.log(`✅ Migrated: ${product.name}`);
    }

    console.log('🎉 Migration completed successfully!');
    
    // Show summary
    const summary = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT c.id) as total_categories,
        COUNT(DISTINCT pi.id) as total_images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `);
    
    console.log('\n📊 Migration Summary:');
    console.log(`- Total Products: ${summary.rows[0].total_products}`);
    console.log(`- Total Categories: ${summary.rows[0].total_categories}`);
    console.log(`- Total Images: ${summary.rows[0].total_images}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit();
  }
}

// Run migration
migrateData();
