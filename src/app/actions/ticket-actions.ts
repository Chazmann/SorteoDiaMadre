
// src/app/actions/ticket-actions.ts
'use server';

import db from '@/lib/db';
import { Ticket } from '@/lib/types';
import { RowDataPacket } from 'mysql2';

// Tipado para los datos que vienen del formulario
type CreateTicketData = {
  sellerName: string; // Lo mantenemos por si se usa en otro lado, pero no se guardará en DB
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
};

// Tipado para las filas que vienen de la base de datos
interface TicketRow extends RowDataPacket {
  id: number;
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
    sellerName: '', // Devolvemos un string vacío porque no lo estamos obteniendo de la DB
    buyerName: row.buyer_name,
    buyerPhoneNumber: row.buyer_phone_number,
    numbers: [row.number_1, row.number_2, row.number_3, row.number_4],
    imageUrl: '', 
    drawingDate: 'October 28, 2025',
  };
}


export async function getTickets(): Promise<Ticket[]> {
  try {
    // Se ajusta la consulta para que coincida con las columnas reales. Se omite cualquier referencia a vendedor.
    const [rows] = await db.query<TicketRow[]>('SELECT id, buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash FROM tickets ORDER BY id DESC');
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
  const { buyerName, buyerPhoneNumber, numbers } = data;

  // Ordenamos los números para crear el hash de forma consistente
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const numbersHash = sortedNumbers.join(',');

  // La consulta INSERT ahora usa las columnas correctas y omite `seller_id`.
  const query = `
    INSERT INTO tickets 
    (buyer_name, buyer_phone_number, number_1, number_2, number_3, number_4, numbers_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // Se pasan los parámetros en el orden correcto
    const [result] = await db.execute(query, [
      buyerName,
      buyerPhoneNumber,
      sortedNumbers[0],
      sortedNumbers[1],
      sortedNumbers[2],
      sortedNumbers[3],
      numbersHash,
    ]);
    
    // Obtenemos el ID del ticket recién insertado
    const insertId = (result as any).insertId;
    if (!insertId) {
        throw new Error('Failed to get insertId from database response.');
    }
    return insertId;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
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
