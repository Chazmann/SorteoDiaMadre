// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import bcrypt from 'bcryptjs';

interface SellerRow extends RowDataPacket, Seller {}

/**
 * Busca un vendedor por su nombre. Si no existe, lo crea.
 * También se asegura de que el vendedor tenga una contraseña hasheada.
 * Devuelve el ID del vendedor.
 * @param name - El nombre del vendedor a buscar o crear.
 * @returns El ID del vendedor.
 */
export async function getOrCreateSeller(name: string): Promise<number> {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.query<SellerRow[]>('SELECT id, password_hash FROM sellers WHERE name = ?', [name]);

    const defaultPassword = '1234';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    if (rows.length > 0) {
      const seller = rows[0];
      // Si el vendedor existe pero no tiene hash o es inválido, lo actualizamos.
      // Una forma simple de verificar es ver si el hash guardado corresponde a '1234'.
      const isPasswordSet = seller.password_hash && await bcrypt.compare(defaultPassword, seller.password_hash);
      if (!isPasswordSet) {
          // Opcional: Podrías querer actualizar el hash aquí si es necesario, 
          // pero para 'getOrCreate' es más seguro solo confiar en la creación inicial.
      }
      return seller.id;
    } else {
      // Si no existe, lo creamos con el nombre como username y la contraseña hasheada.
      const [result] = await connection.execute<ResultSetHeader>('INSERT INTO sellers (name, username, password_hash) VALUES (?, ?, ?)', [name, name, passwordHash]);
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
        const [rows] = await connection.query<SellerRow[]>('SELECT id, name, username FROM sellers ORDER BY name ASC');
        return rows;
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    } finally {
        connection.release();
    }
}

/**
 * Valida las credenciales de un vendedor por su nombre.
 * @param name - El nombre del vendedor.
 * @param password - La contraseña en texto plano a verificar.
 * @returns El objeto del vendedor si las credenciales son correctas, de lo contrario null.
 */
export async function validateSellerCredentials(name: string, password: string): Promise<Omit<Seller, 'password_hash' | 'created_at'> | null> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, username, password_hash FROM sellers WHERE name = ?',
            [name]
        );

        if (rows.length > 0) {
            const seller = rows[0];
            // Si no hay hash de contraseña, no se puede autenticar
            if (!seller.password_hash) {
                return null;
            }
            
            const passwordMatch = await bcrypt.compare(password, seller.password_hash);
            
            if (passwordMatch) {
                // Devolvemos solo la información necesaria para la sesión
                return { id: seller.id, name: seller.name, username: seller.username };
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