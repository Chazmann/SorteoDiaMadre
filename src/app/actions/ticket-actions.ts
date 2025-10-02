
// src/app/actions/ticket-actions.ts
'use server';

import db from '@/lib/db';
import { Ticket } from '@/lib/types';

// Tipado para los datos que vienen del formulario
type CreateTicketData = {
  sellerName: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
};

// Tipado para las filas que vienen de la base de datos
type TicketRow = {
  id: number;
  seller_name: string;
  buyer_name: string;
  buyer_phone_number: string;
  number_1: number;
  number_2: number;
  number_3: number;
  number_4: number;
  numbers_hash: string;
};

// Función para mapear una fila de la DB a nuestro tipo Ticket
function mapRowToTicket(row: TicketRow): Ticket {
  return {
    id: String(row.id),
    sellerName: row.seller_name,
    buyerName: row.buyer_name,
    buyerPhoneNumber: row.buyer_phone_number,
    numbers: [row.number_1, row.number_2, row.number_3, row.number_4],
    // Estos valores no están en la tabla, se generan después
    imageUrl: '', 
    drawingDate: 'October 28, 2025',
  };
}


export async function getTickets(): Promise<Ticket[]> {
  try {
    const [rows] = await db.query<TicketRow[]>('SELECT id, seller_name, buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash FROM tickets ORDER BY id DESC');
    return rows.map(mapRowToTicket);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw new Error('Could not fetch tickets from database.');
  }
}

export async function createTicket(data: CreateTicketData): Promise<number> {
  const { sellerName, buyerName, buyerPhoneNumber, numbers } = data;

  // Ordenar números para asegurar un hash consistente
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const numbersHash = sortedNumbers.join(',');

  const query = `
    INSERT INTO tickets 
    (seller_name, buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [
      sellerName,
      buyerName,
      buyerPhoneNumber,
      sortedNumbers[0],
      sortedNumbers[1],
      sortedNumbers[2],
      sortedNumbers[3],
      numbersHash,
    ]);
    
    // `insertId` está en el objeto de resultado para consultas INSERT
    const insertId = (result as any).insertId;
    if (!insertId) {
        throw new Error('Failed to get insertId from database response.');
    }
    return insertId;
  } catch (error) {
    console.error('Error creating ticket:', error);
    // Re-lanzamos el error para que el cliente pueda manejarlo (ej. error de duplicado)
    throw error;
  }
}

export async function getUsedNumberHashes(): Promise<string[]> {
    try {
        const [rows] = await db.query<{ numbers_hash: string }[]>('SELECT numbers_hash FROM tickets');
        return rows.map(row => row.numbers_hash);
    } catch (error) {
        console.error('Error fetching used number hashes:', error);
        throw new Error('Could not fetch used numbers from database.');
    }
}
