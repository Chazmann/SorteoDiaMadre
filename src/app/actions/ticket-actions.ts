// src/app/actions/ticket-actions.ts
'use server';

import db from '@/lib/db';
import { Ticket } from '@/lib/types';
import { RowDataPacket } from 'mysql2';
import { getOrCreateSeller } from './seller-actions';

type CreateTicketData = {
  sellerName: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
};

// El tipo de fila ahora une tickets y sellers
interface TicketWithSellerRow extends RowDataPacket {
  id: number;
  seller_name: string; // de la tabla sellers
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
    sellerName: row.seller_name,
    buyerName: row.buyer_name,
    buyerPhoneNumber: row.buyer_phone_number,
    numbers: [row.number_1, row.number_2, row.number_3, row.number_4],
    imageUrl: '', // Se genera en el cliente, esto está bien
    drawingDate: 'October 28, 2025',
  };
}


export async function getTickets(): Promise<Ticket[]> {
  try {
    // Unimos las tablas para obtener el nombre del vendedor
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
        JOIN sellers s ON t.seller_id = s.id
        ORDER BY t.id DESC
    `;
    const [rows] = await db.query<TicketWithSellerRow[]>(query);
    if (!rows) {
        return [];
    }
    return rows.map(mapRowToTicket);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

export async function createTicket(data: CreateTicketData): Promise<number> {
  const { sellerName, buyerName, buyerPhoneNumber, numbers } = data;

  try {
    // 1. Obtenemos o creamos el vendedor y recibimos su ID
    const sellerId = await getOrCreateSeller(sellerName);

    // 2. Ordenamos los números para el hash
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const numbersHash = sortedNumbers.join(',');

    // 3. Insertamos el ticket usando el sellerId
    const query = `
      INSERT INTO tickets 
      (seller_id, buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      sellerId,
      buyerName,
      buyerPhoneNumber,
      sortedNumbers[0],
      sortedNumbers[1],
      sortedNumbers[2],
      sortedNumbers[3],
      numbersHash,
    ]);
    
    const insertId = (result as any).insertId;
    if (!insertId) {
        throw new Error('Failed to get insertId from database response.');
    }
    return insertId;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error; // Re-lanzamos el error para que la UI lo pueda atrapar
  }
}

export async function getUsedNumberHashes(): Promise<string[]> {
    try {
        const [rows] = await db.query<(RowDataPacket & { numbers_hash: string })[]>('SELECT numbers_hash FROM tickets');
        if (!rows) {
            return [];
        }
        return rows.map(row => row.numbers_hash);
    } catch (error) {
        console.error('Error fetching used number hashes:', error);
        return [];
    }
}
