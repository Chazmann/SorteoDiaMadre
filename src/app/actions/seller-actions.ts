// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';


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
    const [rows] = await connection.query<SellerRow[]>('SELECT id FROM sellers WHERE name = ?', [name]);

    if (rows.length > 0) {
      return rows[0].id;
    } else {
      const [result] = await connection.execute<ResultSetHeader>('INSERT INTO sellers (name) VALUES (?)', [name]);
      if (result.insertId) {
        return result.insertId;
      } else {
        throw new Error('Failed to get insertId after creating a new seller.');
      }
    }
  } catch (error) {
    console.error('Error in getOrCreateSeller:', error);
    throw new Error('Could not get or create seller.');
  } finally {
    connection.release();
  }
}

/**
 * Obtiene todos los vendedores de la base de datos.
 * @returns Una lista de vendedores.
 */
export async function getSellers(): Promise<Seller[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>('SELECT id, name FROM sellers ORDER BY name ASC');
        return rows.map(row => ({ id: row.id, name: row.name }));
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    } finally {
        connection.release();
    }
}