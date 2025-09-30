"use client";

import Image from "next/image";
import type { Ticket } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailsModal({ ticket, isOpen, onOpenChange }: TicketDetailsModalProps) {
  if (!ticket) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-primary text-2xl">Detalles de tus números de la suerte</DialogTitle>
          <DialogDescription>
            Aquí esta la información completa de tu ticket con los 4 números, Mucha suerte!!!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
             <Image
                src={ticket.imageUrl}
                alt="Generated lottery ticket for Mother's Day"
                fill
                className="object-contain"
              />
          </div>
          <div className="text-center font-bold text-lg">
            Ticket # {ticket.id}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Números:</h3>
            <div className="flex justify-center items-baseline gap-2 flex-wrap">
                 {ticket.numbers.map((num, i) => (
                    <span key={i} className="font-mono text-2xl bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-md">
                      {String(num).padStart(3, '0')}
                    </span>
                  ))}
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="space-y-1">
                <p className="text-muted-foreground">Comprador</p>
                <p className="font-semibold">{ticket.buyerName}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Contacto</p>
                <p className="font-semibold">{ticket.buyerPhoneNumber}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Vendido por</p>
                <p className="font-semibold">{ticket.sellerName}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Fecha de sorteo</p>
                <p className="font-semibold">{ticket.drawingDate}</p>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
