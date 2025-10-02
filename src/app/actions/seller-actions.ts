// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import bcrypt from 'bcryptjs';

interface SellerRow extends RowDataPacket, Seller {}

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
      const defaultPassword = '1234';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const [result] = await connection.execute<ResultSetHeader>('INSERT INTO sellers (name, password_hash) VALUES (?, ?)', [name, passwordHash]);
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

/**
 * Valida las credenciales de un vendedor.
 * @param sellerId - El ID del vendedor.
 * @param password - La contraseña en texto plano a verificar.
 * @returns El objeto del vendedor si las credenciales son correctas, de lo contrario null.
 */
export async function validateSellerCredentials(sellerId: number, password: string): Promise<Seller | null> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, password_hash FROM sellers WHERE id = ?',
            [sellerId]
        );

        if (rows.length > 0) {
            const seller = rows[0];
            const passwordMatch = await bcrypt.compare(password, seller.password_hash);
            
            if (passwordMatch) {
                return { id: seller.id, name: seller.name };
            }
        }
        return null;
    } catch (error) {
        console.error('Error validating seller credentials:', error);
        throw new Error('Server error during validation.');
    } finally {
        connection.release();
    }
}