
// src/app/actions/ticket-actions.ts
'use server';

import pool from '@/lib/db';
import { Ticket } from '@/lib/types';
import { PoolClient, QueryResultRow } from 'pg';
import { verifySession } from './seller-actions';

type CreateTicketData = {
  sellerId: number;
  sellerToken: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
  paymentMethod: string;
};

interface TicketRow extends QueryResultRow {
    id: number;
    seller_name: string | null; // Can be null from a LEFT JOIN
    buyer_name: string;
    buyer_phone_number: string;
    metodo_pago: string;
}

interface NumberRow extends QueryResultRow {
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
    const result = await client.query<TicketRow>(query);
    
    const tickets: Ticket[] = [];
    for (const row of result.rows) {
        const numbers = await getNumbersForTicket(client, row.id);
        tickets.push({
            id: String(row.id),
            sellerName: row.seller_name || 'N/A', // Fallback for null seller name
            buyerName: row.buyer_name,
            buyerPhoneNumber: row.buyer_phone_number,
            numbers: numbers,
            imageUrl: '', 
            drawingDate: 'Sáb 18/10/25 - Lot. Nac. Noct',
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

export async function createTicket(data: CreateTicketData): Promise<number> {
  const { sellerId, sellerToken, buyerName, buyerPhoneNumber, numbers, paymentMethod } = data;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const isSessionValid = await verifySession(sellerId, sellerToken, client);
    if (!isSessionValid) {
      throw new Error('invalid_session');
    }

    const ticketQuery = `
      INSERT INTO tickets (seller_id, buyer_name, buyer_phone_number, metodo_pago, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;
    const ticketResult = await client.query(ticketQuery, [
      sellerId,
      buyerName,
      buyerPhoneNumber,
      paymentMethod,
    ]);
    
    if (ticketResult.rows.length === 0 || !ticketResult.rows[0].id) {
        throw new Error('Failed to get new ticket ID from database.');
    }
    const ticketId = ticketResult.rows[0].id;
    
    const numberQuery = 'INSERT INTO ticket_numbers (ticket_id, number) VALUES ($1, $2)';
    for (const number of numbers) {
        await client.query(numberQuery, [ticketId, number]);
    }

    await client.query('COMMIT');
    
    return ticketId;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating ticket:', error);
    
    if (error.code === '23505') { 
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
        const result = await client.query<NumberRow>('SELECT number FROM ticket_numbers');
        return new Set(result.rows.map(row => row.number));
    } catch (error) {
        console.error('Error fetching used numbers:', error);
        return new Set();
    } finally {
        client.release();
    }
}


/**
 * Busca un ticket por uno de sus números.
 * @param number - El número a buscar.
 * @returns El objeto Ticket si se encuentra, o null.
 */
export async function getTicketByNumber(number: number): Promise<Ticket | null> {
    const client = await pool.connect();
    try {
        // Primero, encuentra el ticket_id que contiene el número.
        const numberResult = await client.query('SELECT ticket_id FROM ticket_numbers WHERE number = $1', [number]);
        
        if (numberResult.rows.length === 0) {
            return null; // El número no está en ningún ticket.
        }
        
        const ticketId = numberResult.rows[0].ticket_id;

        // Ahora, busca la información completa del ticket.
        const ticketQuery = `
            SELECT 
                t.id, 
                s.name as seller_name, 
                t.buyer_name, 
                t.buyer_phone_number,
                t.metodo_pago
            FROM tickets t
            LEFT JOIN sellers s ON t.seller_id = s.id
            WHERE t.id = $1
        `;
        const ticketResult = await client.query<TicketRow>(ticketQuery, [ticketId]);

        if (ticketResult.rows.length === 0) {
            return null; // Debería ser imposible si el ticket_id vino de la tabla de números, pero es una buena práctica.
        }

        const row = ticketResult.rows[0];
        const numbers = await getNumbersForTicket(client, row.id);

        return {
            id: String(row.id),
            sellerName: row.seller_name || 'N/A',
            buyerName: row.buyer_name,
            buyerPhoneNumber: row.buyer_phone_number,
            numbers: numbers,
            imageUrl: '',
            drawingDate: 'October 28, 2025',
            paymentMethod: row.metodo_pago,
        };

    } catch (error) {
        console.error('Error fetching ticket by number:', error);
        return null;
    } finally {
        client.release();
    }
}
