import pool from '../connection';

export interface StoreSettings {
  id: number;
  store_name: string;
  slogan: string;
  logo_filename: string | null;
  admin_phone: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateStoreSettings {
  store_name?: string;
  slogan?: string;
  logo_filename?: string;
  admin_phone?: string;
}

export async function getStoreSettings(): Promise<StoreSettings | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM store_settings ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching store settings:', error);
    throw error;
  }
}

export async function updateStoreSettings(settings: UpdateStoreSettings): Promise<StoreSettings> {
  try {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (settings.store_name !== undefined) {
      setClause.push(`store_name = $${paramCount}`);
      values.push(settings.store_name);
      paramCount++;
    }

    if (settings.slogan !== undefined) {
      setClause.push(`slogan = $${paramCount}`);
      values.push(settings.slogan);
      paramCount++;
    }

    if (settings.logo_filename !== undefined) {
      setClause.push(`logo_filename = $${paramCount}`);
      values.push(settings.logo_filename);
      paramCount++;
    }

    if (settings.admin_phone !== undefined) {
      setClause.push(`admin_phone = $${paramCount}`);
      values.push(settings.admin_phone);
      paramCount++;
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE store_settings 
      SET ${setClause.join(', ')}
      WHERE id = (SELECT id FROM store_settings ORDER BY id DESC LIMIT 1)
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('No settings found to update');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
}

export async function createDefaultSettings(): Promise<StoreSettings> {
  try {
    const result = await pool.query(`
      INSERT INTO store_settings (store_name, slogan, admin_phone)
      VALUES ($1, $2, $3)
      RETURNING *
    `, ['TOKO SEMBAKO SRI REJEKI UTAMA', 'Belanja Dekat, Lebih Hemat', '6283853399847']);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }
}
