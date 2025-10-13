// src/app/actions/seller-actions.ts
'use server';

import pool from '@/lib/db';
import { Seller } from '@/lib/types';
import { randomBytes } from 'crypto';
import { PoolClient, QueryResultRow } from 'pg';

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
    const client = await pool.connect();
    try {
        const result = await client.query<(Omit<Seller, 'password_hash' | 'created_at' | 'session_token'> & QueryResultRow)>(
            'SELECT id, name, username, role FROM sellers ORDER BY name ASC'
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return [];
    } finally {
        client.release();
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
    const client = await pool.connect();
    try {
        const result = await client.query<Seller & QueryResultRow>(
            'SELECT id, name, username, password_hash, session_token, role FROM sellers WHERE name = $1',
            [name]
        );

        if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
            return { status: 'invalid_credentials' };
        }

        const seller = result.rows[0];

        if (seller.session_token) {
            return { status: 'session_active', seller: { id: seller.id, name: seller.name } };
        }

        const sessionToken = randomBytes(32).toString('hex');
        await client.query(
            'UPDATE sellers SET session_token = $1 WHERE id = $2',
            [sessionToken, seller.id]
        );

        return {
            status: 'success',
            seller: { id: seller.id, name: seller.name, username: seller.username, session_token: sessionToken, role: seller.role }
        };

    } catch (error) {
        console.error('Error validando las credenciales del vendedor:', error);
        throw new Error('Error del servidor durante la validación.');
    } finally {
        client.release();
    }
}

/**
 * Fuerza el inicio de sesión generando un nuevo token y sobrescribiendo el anterior.
 * @param sellerId - El ID del vendedor.
 * @returns El objeto del vendedor con su nuevo token de sesión.
 */
export async function forceLoginAndCreateSession(sellerId: number): Promise<Omit<Seller, 'password_hash' | 'created_at'>> {
    const client = await pool.connect();
    try {
        const sessionToken = randomBytes(32).toString('hex');
        await client.query(
            'UPDATE sellers SET session_token = $1 WHERE id = $2',
            [sessionToken, sellerId]
        );

        const result = await client.query<Seller & QueryResultRow>(
            'SELECT id, name, username, role FROM sellers WHERE id = $1',
            [sellerId]
        );

        if (result.rows.length === 0) {
            throw new Error('Seller not found after forcing login.');
        }
        
        const seller = result.rows[0];

        return { id: seller.id, name: seller.name, username: seller.username, session_token: sessionToken, role: seller.role };
    } catch (error) {
        console.error('Error forcing login:', error);
        throw new Error('Server error during force login.');
    } finally {
        client.release();
    }
}


/**
 * Verifica si el token de sesión de un vendedor es válido.
 * Puede usar una conexión de cliente existente o crear una nueva.
 * @param sellerId - El ID del vendedor.
 * @param sessionToken - El token de sesión a verificar.
 * @param existingClient - Un cliente de base de datos opcional ya conectado.
 * @returns true si el token es válido, false en caso contrario.
 */
export async function verifySession(sellerId: number, sessionToken: string | null, existingClient?: PoolClient): Promise<boolean> {
    if (!sessionToken || !sellerId) {
        return false;
    }
    
    const client = existingClient || await pool.connect();
    
    try {
        const result = await client.query<Pick<Seller, 'session_token'> & QueryResultRow>(
            'SELECT session_token FROM sellers WHERE id = $1',
            [sellerId]
        );

        if (result.rows.length === 0) {
            return false;
        }
        
        const dbToken = result.rows[0].session_token;
        return dbToken === sessionToken;

    } catch (error) {
        console.error('Error verifying session token:', error);
        return false;
    } finally {
        // Only release the client if it was NOT passed as a parameter.
        // This is CRUCIAL for transactions.
        if (!existingClient) {
            client.release();
        }
    }
}


/**
 * Limpia el token de sesión de un vendedor de la base de datos (usado al cerrar sesión).
 * @param sellerId - El ID del vendedor.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function clearSessionToken(sellerId: number): Promise<{ success: boolean }> {
    const client = await pool.connect();
    try {
        await client.query(
            'UPDATE sellers SET session_token = NULL WHERE id = $1',
            [sellerId]
        );
        return { success: true };
    } catch (error) {
        console.error('Error clearing session token:', error);
        return { success: false };
    } finally {
        client.release();
    }
}
