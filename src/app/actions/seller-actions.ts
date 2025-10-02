// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import bcrypt from 'bcryptjs';

interface SellerRow extends RowDataPacket, Seller {}

/**
 * Obtiene todos los vendedores de la base de datos para poblarlos en el login.
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
 * Valida las credenciales de un vendedor por su nombre y contraseña.
 * @param name - El nombre del vendedor seleccionado en el login.
 * @param password - La contraseña en texto plano a verificar.
 * @returns El objeto del vendedor si las credenciales son correctas, de lo contrario null.
 */
export async function validateSellerCredentials(name: string, password: string): Promise<Omit<Seller, 'password_hash' | 'created_at'> | null> {
    const connection = await db.getConnection();
    try {
        // Busca al vendedor por el nombre exacto.
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, username, password_hash FROM sellers WHERE name = ?',
            [name]
        );

        // Si no se encuentra el vendedor, las credenciales son inválidas.
        if (rows.length === 0) {
            return null;
        }

        const seller = rows[0];

        // Si por alguna razón no tiene un hash de contraseña, no puede autenticarse.
        if (!seller.password_hash) {
            return null;
        }
        
        // Compara la contraseña en texto plano con el hash guardado en la base de datos.
        // bcrypt.compare se encarga de todo el proceso de forma segura.
        const passwordMatch = await bcrypt.compare(password, seller.password_hash);
        
        if (passwordMatch) {
            // La contraseña es correcta. Devolvemos los datos para la sesión.
            return { id: seller.id, name: seller.name, username: seller.username };
        } else {
            // La contraseña no coincide.
            return null;
        }
    } catch (error) {
        console.error('Error validando las credenciales del vendedor:', error);
        // Lanza un error para que el frontend pueda manejarlo.
        throw new Error('Error del servidor durante la validación.');
    } finally {
        connection.release();
    }
}
