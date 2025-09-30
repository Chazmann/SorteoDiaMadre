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
          <DialogTitle className="text-primary text-2xl">Your Lucky Ticket Details</DialogTitle>
          <DialogDescription>
            Here is the complete information for your generated ticket. Good luck!
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
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Numbers:</h3>
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
                <p className="text-muted-foreground">Buyer's Name</p>
                <p className="font-semibold">{ticket.buyerName}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Buyer's Phone</p>
                <p className="font-semibold">{ticket.buyerPhoneNumber}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Seller's Name</p>
                <p className="font-semibold">{ticket.sellerName}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Drawing Date</p>
                <p className="font-semibold">{ticket.drawingDate}</p>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
