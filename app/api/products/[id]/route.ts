import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db/connection';

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);

    // Check if product exists
    const checkResult = await query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product
    await query('DELETE FROM products WHERE id = $1', [productId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    // Get product data
    const productResult = await query(
      `SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];

    // Get product images
    const imagesResult = await query(
      `SELECT id, image_url as url, is_primary, display_order
       FROM product_images
       WHERE product_id = $1
       ORDER BY display_order ASC`,
      [productId]
    );

    product.images = imagesResult.rows;

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to get product' },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = parseInt(params.id);
    const body = await request.json();

    const {
      name,
      type,
      price,
      original_price,
      description,
      images, // changed from image to images array
      category_id,
      stock,
      min_stock,
      is_active
    } = body;

    // Update product
    const result = await query(
      `UPDATE products 
      SET 
        name = $1,
        type = $2,
        price = $3,
        original_price = $4,
        description = $5,
        category_id = $6,
        stock = $7,
        min_stock = $8,
        is_active = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
      [
        name,
        type,
        price,
        original_price,
        description,
        category_id,
        stock,
        min_stock,
        is_active,
        productId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = result.rows[0];

    // Delete existing images for product
    await query('DELETE FROM product_images WHERE product_id = $1', [productId]);

    // Insert new images into product_images table if images array is provided
    if (Array.isArray(images) && images.length > 0) {
      const insertImagePromises = images.map((img: { url: string; is_primary: boolean; display_order?: number }) => {
        return query(
          `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
           VALUES ($1, $2, $3, $4)`,
          [
            productId,
            img.url,
            img.is_primary,
            img.display_order || 0
          ]
        );
      });
      await Promise.all(insertImagePromises);
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
