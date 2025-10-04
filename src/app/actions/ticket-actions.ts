
// src/app/actions/ticket-actions.ts
'use server';

import db from '@/lib/db';
import { Ticket } from '@/lib/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { verifySession } from './seller-actions';

type CreateTicketData = {
  sellerId: number;
  sellerToken: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
  paymentMethod: string;
};

interface TicketRow extends RowDataPacket {
    id: number;
    seller_name: string;
    buyer_name: string;
    buyer_phone_number: string;
    metodo_pago: string;
}

interface NumberRow extends RowDataPacket {
    number: number;
}

async function getNumbersForTicket(connection: PoolConnection, ticketId: number): Promise<number[]> {
    const [numberRows] = await connection.query<NumberRow[]>('SELECT number FROM ticket_numbers WHERE ticket_id = ? ORDER BY number ASC', [ticketId]);
    return numberRows.map(row => row.number);
}


export async function getTickets(): Promise<Ticket[]> {
  const connection = await db.getConnection();
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
    const [ticketRows] = await connection.query<TicketRow[]>(query);
    
    const tickets: Ticket[] = [];
    for (const row of ticketRows) {
        const numbers = await getNumbersForTicket(connection, row.id);
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
    connection.release();
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
  
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const ticketQuery = `
      INSERT INTO tickets (seller_id, buyer_name, buyer_phone_number, metodo_pago)
      VALUES (?, ?, ?, ?)
    `;
    const [ticketResult] = await connection.execute<ResultSetHeader>(ticketQuery, [
      sellerId,
      buyerName,
      buyerPhoneNumber,
      paymentMethod,
    ]);
    
    const ticketId = ticketResult.insertId;
    if (!ticketId) {
        throw new Error('Failed to get insertId from database response.');
    }

    const numberQuery = 'INSERT INTO ticket_numbers (ticket_id, number) VALUES ?';
    const numberValues = numbers.map(num => [ticketId, num]);
    await connection.query(numberQuery, [numberValues]);

    await connection.commit();
    
    return ticketId;

  } catch (error) {
    await connection.rollback();
    console.error('Error creating ticket:', error);
    // Re-throw the original error or a new one to be caught by the frontend
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
        throw new Error('duplicate_number');
    }
    throw error; 
  } finally {
      connection.release();
  }
}

export async function getUsedNumbers(): Promise<Set<number>> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<(RowDataPacket & { number: number })[]>('SELECT number FROM ticket_numbers');
        return new Set(rows.map(row => row.number));
    } catch (error) {
        console.error('Error fetching used numbers:', error);
        return new Set();
    } finally {
        connection.release();
    }
}
