// src/app/actions/prize-actions.ts
'use server';

import db from '@/lib/db';
import { Prize } from '@/lib/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';

interface PrizeRow extends RowDataPacket, Prize {}

/**
 * Obtiene todos los premios de la base de datos, ordenados por prize_order.
 * @returns Una lista de premios.
 */
export async function getPrizes(): Promise<Prize[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<PrizeRow[]>('SELECT id, prize_order, title, image_url FROM prizes ORDER BY prize_order ASC');
        return rows;
    } catch (error) {
        console.error('Error fetching prizes:', error);
        return [];
    } finally {
        connection.release();
    }
}

/**
 * Actualiza la información de un premio en la base de datos.
 * @param id - El ID del premio a actualizar.
 * @param title - El nuevo título del premio.
 * @param imageUrl - La nueva URL de la imagen del premio.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function updatePrize(id: number, title: string, imageUrl: string): Promise<{ success: boolean; message: string }> {
  const connection = await db.getConnection();
  try {
    const query = 'UPDATE prizes SET title = ?, image_url = ? WHERE id = ?';
    const [result] = await connection.execute<ResultSetHeader>(query, [title, imageUrl, id]);

    if (result.affectedRows > 0) {
      revalidatePath('/');
      revalidatePath('/admin');
      return { success: true, message: 'Premio actualizado correctamente.' };
    } else {
      return { success: false, message: 'No se encontró el premio para actualizar.' };
    }
  } catch (error) {
    console.error('Error updating prize:', error);
    return { success: false, message: 'Error en el servidor al actualizar el premio.' };
  } finally {
    connection.release();
  }
}
