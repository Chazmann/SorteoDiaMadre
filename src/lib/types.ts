
export interface Ticket {
  id: string;
  sellerName: string;
  buyerName: string;
  buyerPhoneNumber: string;
  numbers: number[];
  imageUrl: string;
  drawingDate: string;
}

export interface Prize {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}
