

export interface Ticket {
  id: string;
  sellerName: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
  imageUrl: string;
  drawingDate: string;
  paymentMethod?: string;
}

export interface Prize {
  id: number;
  prize_order: number;
  title: string;
  image_url: string;
  winning_number?: number | null; // Columna para el número ganador
}


export interface Seller {
    id: number;
    name: string;
    username: string;
    created_at: string;
    password_hash: string;
    session_token?: string | null;
    role: 'vendedor' | 'admin';
}

// Estructura de datos para un ganador
export interface Winner extends Prize {
    winner_ticket_id?: string;
    winner_buyer_name?: string;
    winner_buyer_phone?: string;
    winner_seller_name?: string;
    winner_ticket_numbers?: number[];
}
