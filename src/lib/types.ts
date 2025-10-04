

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
}


export interface Seller {
    id: number;
    name: string;
    username: string;
    created_at: string;
    password_hash: string;
    session_token?: string | null;
}

