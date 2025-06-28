import { NextResponse } from 'next/server';
import { getStoreSettings, createDefaultSettings } from '@/lib/db/queries/settings';

export async function GET() {
  try {
    let settings = await getStoreSettings();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await createDefaultSettings();
    }

    // Transform to match the expected format for frontend
    const storeInfo = {
      name: settings.store_name,
      tagline: settings.slogan,
      whatsappNumber: settings.admin_phone,
      logo: settings.logo_filename ? `/uploads/${settings.logo_filename}` : null,
      minPurchase: 2 // Keep existing default
    };

    return NextResponse.json({ storeInfo });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    
    // Return fallback data if database fails
    const fallbackStoreInfo = {
      name: "TOKO SEMBAKO SRI REJEKI UTAMA",
      tagline: "Belanja Dekat, Lebih Hemat",
      whatsappNumber: "6283853399847",
      logo: null,
      minPurchase: 2
    };
    
    return NextResponse.json({ storeInfo: fallbackStoreInfo });
  }
}
