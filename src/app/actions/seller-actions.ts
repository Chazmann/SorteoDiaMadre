// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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
    // 1. Intentar encontrar el vendedor por nombre
    const [rows] = await connection.query<SellerRow[]>('SELECT id FROM sellers WHERE name = ?', [name]);

    if (rows.length > 0) {
      // Vendedor encontrado, devolver su ID
      return rows[0].id;
    } else {
      // 2. Vendedor no encontrado, crearlo
      const [result] = await connection.execute<ResultSetHeader>('INSERT INTO sellers (name) VALUES (?)', [name]);
      if (result.insertId) {
        return result.insertId;
      } else {
        throw new Error('Failed to get insertId after creating a new seller.');
      }
    }
  } catch (error) {
    console.error('Error in getOrCreateSeller:', error);
    // Relanzar el error para que el llamador sepa que algo salió mal.
    throw new Error('Could not get or create seller.');
  } finally {
    connection.release();
  }
}
