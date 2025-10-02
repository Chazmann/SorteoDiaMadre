// src/app/actions/ticket-actions.ts
'use server';

import db from '@/lib/db';
import { Ticket } from '@/lib/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

type CreateTicketData = {
  sellerId: number; // Cambiado a sellerId
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
};

interface TicketWithSellerRow extends RowDataPacket {
  id: number;
  seller_name: string; 
  buyer_name: string;
  buyer_phone_number: string;
  number_1: number;
  number_2: number;
  number_3: number;
  number_4: number;
};

function mapRowToTicket(row: TicketWithSellerRow): Ticket {
  return {
    id: String(row.id),
    sellerName: row.seller_name, // Mantenemos el nombre para la UI
    buyerName: row.buyer_name,
    buyerPhoneNumber: row.buyer_phone_number,
    numbers: [row.number_1, row.number_2, row.number_3, row.number_4],
    imageUrl: '', 
    drawingDate: 'October 28, 2025',
  };
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
            t.number_1, 
            t.number_2, 
            t.number_3, 
            t.number_4
        FROM tickets t
        LEFT JOIN sellers s ON t.seller_id = s.id
        ORDER BY t.id DESC
    `;
    const [rows] = await connection.query<TicketWithSellerRow[]>(query);
    return rows.map(mapRowToTicket);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  } finally {
    connection.release();
  }
}

export async function createTicket(data: CreateTicketData): Promise<number> {
  const { sellerId, buyerName, buyerPhoneNumber, numbers } = data;
  const connection = await db.getConnection();

  try {
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const numbersHash = sortedNumbers.join(',');

    const query = `
      INSERT INTO tickets 
      (seller_id, buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute<ResultSetHeader>(query, [
      sellerId,
      buyerName,
      buyerPhoneNumber,
      sortedNumbers[0],
      sortedNumbers[1],
      sortedNumbers[2],
      sortedNumbers[3],
      numbersHash,
    ]);
    
    if (result.insertId) {
        return result.insertId;
    } else {
        throw new Error('Failed to get insertId from database response.');
    }
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error; 
  } finally {
      connection.release();
  }
}

export async function getUsedNumberHashes(): Promise<string[]> {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query<(RowDataPacket & { numbers_hash: string })[]>('SELECT numbers_hash FROM tickets');
        return rows.map(row => row.numbers_hash);
    } catch (error) {
        console.error('Error fetching used number hashes:', error);
        return [];
    } finally {
        connection.release();
    }
}