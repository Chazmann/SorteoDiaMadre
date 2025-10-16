
// src/app/actions/prize-actions.ts
'use server';

import pool from '@/lib/db';
import { Prize, Winner } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { QueryResultRow } from 'pg';
import { getTicketByNumber } from './ticket-actions';

/**
 * Inserta los premios por defecto si la tabla está vacía.
 */
async function insertDefaultPrizes(): Promise<Prize[]> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const defaultPrizes = [
            { prize_order: 1, title: '1° Premio | Freidora De Aire', image_url: '/generic-prize.jpg' },
            { prize_order: 2, title: '2° Premio | Juego De Sábanas', image_url: '/generic-prize.jpg' },
            { prize_order: 3, title: '3° Premio | Libro de Chistes', image_url: '/generic-prize.jpg' },
        ];

        const insertedPrizes: Prize[] = [];

        for (const prize of defaultPrizes) {
            const result = await client.query<Prize & QueryResultRow>(
                'INSERT INTO prizes (prize_order, title, image_url, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING id, prize_order, title, image_url, winning_number',
                [prize.prize_order, prize.title, prize.image_url]
            );
            insertedPrizes.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        return insertedPrizes.sort((a, b) => a.prize_order - b.prize_order);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inserting default prizes:', error);
        return [];
    } finally {
        client.release();
    }
}


/**
 * Obtiene todos los premios de la base de datos, ordenados por prize_order.
 * Si la tabla está vacía, inserta los premios por defecto.
 * @returns Una lista de premios.
 */
export async function getPrizes(): Promise<Prize[]> {
    const client = await pool.connect();
    try {
        const result = await client.query<Prize & QueryResultRow>(
            'SELECT id, prize_order, title, image_url, winning_number FROM prizes ORDER BY prize_order ASC'
        );
        
        if (result.rows.length === 0) {
            // Si no hay premios, los inserta y los devuelve.
            return await insertDefaultPrizes();
        }

        return result.rows;

    } catch (error) {
        console.error('Error fetching prizes:', error);
        return [];
    } finally {
        client.release();
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
  const client = await pool.connect();
  try {
    const query = 'UPDATE prizes SET title = $1, image_url = $2, updated_at = NOW() WHERE id = $3';
    const result = await client.query(query, [title, imageUrl, id]);
    
    const changedRows = result.rowCount;
    
    if (changedRows > 0) {
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
    client.release();
  }
}

/**
 * Establece el número ganador para un premio específico.
 * @param prizeId - El ID del premio.
 * @param winningNumber - El número ganador.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function setWinningNumber(prizeId: number, winningNumber: number | null): Promise<{ success: boolean; message: string }> {
    const client = await pool.connect();
    try {
        const query = 'UPDATE prizes SET winning_number = $1, updated_at = NOW() WHERE id = $2';
        await client.query(query, [winningNumber, prizeId]);

        revalidatePath('/admin');
        return { success: true, message: 'Número ganador guardado.' };
    } catch (error) {
        console.error('Error setting winning number:', error);
        return { success: false, message: 'Error al guardar el número ganador.' };
    } finally {
        client.release();
    }
}

/**
 * Obtiene la lista de premios con la información del ganador si existe.
 * @returns Una lista de objetos Winner.
 */
export async function getWinnersData(): Promise<Winner[]> {
    const prizes = await getPrizes();
    
    const winners: Winner[] = [];

    for (const prize of prizes) {
        let winnerData: Winner = { ...prize };
        
        if (prize.winning_number !== null && prize.winning_number !== undefined) {
            const ticket = await getTicketByNumber(prize.winning_number);

            if (ticket) {
                winnerData = {
                    ...winnerData,
                    winner_ticket_id: ticket.id,
                    winner_buyer_name: ticket.buyerName,
                    winner_buyer_phone: ticket.buyerPhoneNumber,
                    winner_seller_name: ticket.sellerName,
                    winner_ticket_numbers: ticket.numbers,
                };
            }
        }
        winners.push(winnerData);
    }
    
    return winners;
}
