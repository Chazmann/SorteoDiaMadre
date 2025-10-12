
// src/app/actions/ticket-actions.ts
'use server';

import pool from '@/lib/db';
import { Ticket } from '@/lib/types';
import { PoolClient } from 'pg';
import { verifySession } from './seller-actions';

type CreateTicketData = {
  sellerId: number;
  sellerToken: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
  paymentMethod: string;
};

interface TicketRow {
    id: number;
    seller_name: string;
    buyer_name: string;
    buyer_phone_number: string;
    metodo_pago: string;
}

interface NumberRow {
    number: number;
}

async function getNumbersForTicket(client: PoolClient, ticketId: number): Promise<number[]> {
    const result = await client.query<NumberRow>('SELECT number FROM ticket_numbers WHERE ticket_id = $1 ORDER BY number ASC', [ticketId]);
    return result.rows.map(row => row.number);
}


export async function getTickets(): Promise<Ticket[]> {
  const client = await pool.connect();
  try {
    const query = `
        SELECT 
            t.id, 
            s.name as seller_name, 
            t.buyer_name, 
            t.buyer_phone_number,
            t.metodo_pago
        FROM tickets t
        LEFT JOIN sellers s ON t.seller_id = s.id
        ORDER BY t.id DESC
    `;
    const ticketResult = await client.query<TicketRow>(query);
    
    const tickets: Ticket[] = [];
    for (const row of ticketResult.rows) {
        const numbers = await getNumbersForTicket(client, row.id);
        tickets.push({
            id: String(row.id),
            sellerName: row.seller_name,
            buyerName: row.buyer_name,
            buyerPhoneNumber: row.buyer_phone_number,
            numbers: numbers,
            imageUrl: '', 
            drawingDate: 'October 28, 2025',
            paymentMethod: row.metodo_pago,
        });
    }
    return tickets;

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * Creates a new ticket after verifying the seller's session.
 * @param data - The data for creating the ticket, including session info.
 * @returns The ID of the newly created ticket.
 * @throws An error if the session is invalid or ticket creation fails.
 */
export async function createTicket(data: CreateTicketData): Promise<number> {
  const { sellerId, sellerToken, buyerName, buyerPhoneNumber, numbers, paymentMethod } = data;

  // 1. Verify session before proceeding
  const isSessionValid = await verifySession(sellerId, sellerToken);
  if (!isSessionValid) {
    throw new Error('invalid_session');
  }
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketQuery = `
      INSERT INTO tickets (seller_id, buyer_name, buyer_phone_number, metodo_pago)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const ticketResult = await client.query(ticketQuery, [
      sellerId,
      buyerName,
      buyerPhoneNumber,
      paymentMethod,
    ]);
    
    const ticketId = ticketResult.rows[0]?.id;
    if (!ticketId) {
        throw new Error('Failed to get insertId from database response.');
    }
    
    // El cliente de `pg` no soporta la inserción múltiple con `VALUES ?` como `mysql2`.
    // Hay que construir una consulta con múltiples tuplas de valores.
    const numberValues = numbers.map(num => `(${ticketId}, ${num})`).join(',');
    const numberQuery = `INSERT INTO ticket_numbers (ticket_id, number) VALUES ${numberValues}`;
    await client.query(numberQuery);

    await client.query('COMMIT');
    
    return ticketId;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating ticket:', error);
    // Re-throw the original error or a new one to be caught by the frontend
    // Los códigos de error de PostgreSQL son diferentes
    if (error.code === '23505') { // '23505' es unique_violation en PostgreSQL
        throw new Error('duplicate_number');
    }
    throw error; 
  } finally {
      client.release();
  }
}

export async function getUsedNumbers(): Promise<Set<number>> {
    const client = await pool.connect();
    try {
        const result = await client.query<{ number: number }>('SELECT number FROM ticket_numbers');
        return new Set(result.rows.map(row => row.number));
    } catch (error) {
        console.error('Error fetching used numbers:', error);
        return new Set();
    } finally {
        client.release();
    }
}
