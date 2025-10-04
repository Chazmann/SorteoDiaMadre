// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import { randomBytes } from 'crypto';

interface SellerRow extends RowDataPacket, Seller {}

/**
 * Obtiene todos los vendedores de la base de datos para poblarlos en el login.
 * @returns Una lista de vendedores.
 */
export async function getSellers(): Promise<Omit<Seller, 'password_hash' | 'created_at' | 'session_token'>[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>('SELECT id, name, username FROM sellers ORDER BY name ASC');
        return rows.map(s => ({ id: s.id, name: s.name, username: s.username }));
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    } finally {
        connection.release();
    }
}

/**
 * Valida las credenciales de un vendedor por su nombre y contraseña (texto plano).
 * Si son correctas, genera un token de sesión único, lo guarda y lo devuelve.
 * @param name - El nombre del vendedor seleccionado en el login.
 * @param password - La contraseña en texto plano a verificar.
 * @returns El objeto del vendedor con su token de sesión si las credenciales son correctas, de lo contrario null.
 */
export async function validateSellerCredentials(name: string, password: string): Promise<Omit<Seller, 'password_hash' | 'created_at'> | null> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, username, password_hash FROM sellers WHERE name = ?',
            [name]
        );

        if (rows.length === 0) {
            return null;
        }

        const seller = rows[0];

        if (seller.password_hash === password) {
            // Generar un token de sesión único.
            const sessionToken = randomBytes(32).toString('hex');
            
            // Actualizar el token en la base de datos para este vendedor.
            await connection.execute(
                'UPDATE sellers SET session_token = ? WHERE id = ?',
                [sessionToken, seller.id]
            );

            return { id: seller.id, name: seller.name, username: seller.username, session_token: sessionToken };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error validando las credenciales del vendedor:', error);
        throw new Error('Error del servidor durante la validación.');
    } finally {
        connection.release();
    }
}


/**
 * Verifica si el token de sesión de un vendedor es válido.
 * @param sellerId - El ID del vendedor.
 * @param sessionToken - El token de sesión a verificar.
 * @returns true si el token es válido, false en caso contrario.
 */
export async function verifySessionToken(sellerId: number, sessionToken: string | null): Promise<boolean> {
    if (!sessionToken || !sellerId) {
        return false;
    }
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT session_token FROM sellers WHERE id = ?',
            [sellerId]
        );

        if (rows.length === 0) {
            return false;
        }
        
        const dbToken = rows[0].session_token;
        return dbToken === sessionToken;

    } catch (error) {
        console.error('Error verifying session token:', error);
        return false;
    } finally {
        connection.release();
    }
}


/**
 * Limpia el token de sesión de un vendedor de la base de datos (usado al cerrar sesión).
 * @param sellerId - El ID del vendedor.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function clearSessionToken(sellerId: number): Promise<{ success: boolean }> {
    const connection = await db.getConnection();
    try {
        await connection.execute(
            'UPDATE sellers SET session_token = NULL WHERE id = ?',
            [sellerId]
        );
        return { success: true };
    } catch (error) {
        console.error('Error clearing session token:', error);
        return { success: false };
    } finally {
        connection.release();
    }
}
