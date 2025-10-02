// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Interfaz para la fila de la tabla sellers
interface SellerRow extends RowDataPacket {
  id: number;
  name: string;
}

/**
 * Busca un vendedor por su nombre. Si no existe, lo crea.
 * Devuelve el ID del vendedor.
 * @param name - El nombre del vendedor a buscar o crear.
 * @returns El ID del vendedor.
 */
export async function getOrCreateSeller(name: string): Promise<number> {
  const connection = await db.getConnection();
  try {
    // 1. Intentar encontrar el vendedor
    const [rows] = await connection.query<SellerRow[]>('SELECT id FROM sellers WHERE name = ?', [name]);

    if (rows && rows.length > 0) {
      // El vendedor ya existe, devolvemos su ID
      return rows[0].id;
    } else {
      // 2. El vendedor no existe, lo creamos
      const [result] = await connection.execute('INSERT INTO sellers (name) VALUES (?)', [name]);
      const insertId = (result as any).insertId;
      if (!insertId) {
        throw new Error('Failed to create a new seller.');
      }
      return insertId;
    }
  } catch (error) {
    console.error('Error in getOrCreateSeller:', error);
    throw new Error('Could not get or create seller.');
  } finally {
    connection.release();
  }
}
