// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import bcrypt from 'bcryptjs';

interface SellerRow extends RowDataPacket, Seller {}

/**
 * Busca un vendedor por su nombre. Si no existe, lo crea con una contraseña por defecto.
 * Devuelve el ID del vendedor.
 * @param name - El nombre del vendedor a buscar o crear.
 * @returns El ID del vendedor.
 */
export async function getOrCreateSeller(name: string): Promise<number> {
  const connection = await db.getConnection();
  try {
    // Primero, intenta encontrar al vendedor por su nombre
    const [rows] = await connection.query<SellerRow[]>('SELECT id FROM sellers WHERE name = ?', [name]);

    if (rows.length > 0) {
      // Si el vendedor existe, simplemente devuelve su ID
      return rows[0].id;
    } else {
      // Si el vendedor no existe, lo creamos
      const defaultPassword = '1234';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO sellers (name, username, password_hash) VALUES (?, ?, ?)',
        [name, name, passwordHash] // Usamos el nombre como username por simplicidad
      );
      
      if (result.insertId) {
        return result.insertId;
      } else {
        throw new Error('No se pudo obtener el ID del vendedor recién creado.');
      }
    }
  } catch (error) {
    console.error('Error en getOrCreateSeller:', error);
    throw new Error('No se pudo obtener o crear el vendedor.');
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
            // Si no hay hash de contraseña en la BD, no se puede autenticar
            if (!seller.password_hash) {
                return null;
            }
            
            // Compara la contraseña en texto plano con el hash guardado
            const passwordMatch = await bcrypt.compare(password, seller.password_hash);
            
            if (passwordMatch) {
                // Devolvemos solo la información necesaria para la sesión
                return { id: seller.id, name: seller.name, username: seller.username };
            }
        }
        // Si no se encuentra el usuario o la contraseña no coincide, retorna null
        return null;
    } catch (error) {
        console.error('Error validando las credenciales del vendedor:', error);
        throw new Error('Error del servidor durante la validación.');
    } finally {
        connection.release();
    }
}
