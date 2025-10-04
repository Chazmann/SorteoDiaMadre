// src/app/actions/seller-actions.ts
'use server';

import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Seller } from '@/lib/types';
import { randomBytes } from 'crypto';

interface SellerRow extends RowDataPacket, Seller {}

export type ValidateCredentialsResponse = {
  status: 'success';
  seller: Omit<Seller, 'password_hash' | 'created_at'>;
} | {
  status: 'session_active';
  seller: { id: number; name: string };
} | {
  status: 'invalid_credentials';
};

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
 * Valida las credenciales de un vendedor.
 * Si son correctas y no hay sesión activa, inicia una nueva sesión.
 * Si son correctas y SÍ hay una sesión activa, devuelve un estado para confirmación.
 * @param name - El nombre del vendedor.
 * @param password - La contraseña en texto plano.
 * @returns Un objeto con el estado de la validación.
 */
export async function validateSellerCredentials(name: string, password: string): Promise<ValidateCredentialsResponse> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, username, password_hash, session_token FROM sellers WHERE name = ?',
            [name]
        );

        if (rows.length === 0 || rows[0].password_hash !== password) {
            return { status: 'invalid_credentials' };
        }

        const seller = rows[0];

        // Si ya hay un token de sesión, informamos al cliente para que pida confirmación.
        if (seller.session_token) {
            return { status: 'session_active', seller: { id: seller.id, name: seller.name } };
        }

        // Si no hay sesión activa, procedemos a crear una nueva.
        const sessionToken = randomBytes(32).toString('hex');
        await connection.execute(
            'UPDATE sellers SET session_token = ? WHERE id = ?',
            [sessionToken, seller.id]
        );

        return {
            status: 'success',
            seller: { id: seller.id, name: seller.name, username: seller.username, session_token: sessionToken }
        };

    } catch (error) {
        console.error('Error validando las credenciales del vendedor:', error);
        throw new Error('Error del servidor durante la validación.');
    } finally {
        connection.release();
    }
}

/**
 * Fuerza el inicio de sesión generando un nuevo token y sobrescribiendo el anterior.
 * @param sellerId - El ID del vendedor.
 * @returns El objeto del vendedor con su nuevo token de sesión.
 */
export async function forceLoginAndCreateSession(sellerId: number): Promise<Omit<Seller, 'password_hash' | 'created_at'>> {
    const connection = await db.getConnection();
    try {
        const sessionToken = randomBytes(32).toString('hex');
        await connection.execute(
            'UPDATE sellers SET session_token = ? WHERE id = ?',
            [sessionToken, sellerId]
        );

        const [rows] = await connection.query<SellerRow[]>(
            'SELECT id, name, username FROM sellers WHERE id = ?',
            [sellerId]
        );

        if (rows.length === 0) {
            throw new Error('Seller not found after forcing login.');
        }
        
        const seller = rows[0];

        return { id: seller.id, name: seller.name, username: seller.username, session_token: sessionToken };
    } catch (error) {
        console.error('Error forcing login:', error);
        throw new Error('Server error during force login.');
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
export async function verifySession(sellerId: number, sessionToken: string | null): Promise<boolean> {
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
