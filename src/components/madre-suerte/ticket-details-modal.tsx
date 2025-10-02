
"use client";

import Image from "next/image";
import * as React from "react";
import type { Ticket } from "@/lib/types";
import { generateMotherSDayImage } from "@/ai/flows/generate-mother-s-day-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketDetailsModal({ ticket, isOpen, onOpenChange }: TicketDetailsModalProps) {
  const [localTicket, setLocalTicket] = React.useState(ticket);
  const [isLoadingImage, setIsLoadingImage] = React.useState(false);

  React.useEffect(() => {
    const generateImageIfNeeded = async () => {
      if (ticket && !ticket.imageUrl && ticket.id) {
        setIsLoadingImage(true);
        try {
          const result = await generateMotherSDayImage({
            ticketId: String(ticket.id).padStart(3, '0'),
            sellerName: ticket.sellerName,
            buyerName: ticket.buyerName,
            buyerPhoneNumber: ticket.buyerPhoneNumber,
            numbers: ticket.numbers,
          });
          if (result.image) {
            setLocalTicket({ ...ticket, imageUrl: result.image });
          }
        } catch (error) {
          console.error("Failed to generate image for modal:", error);
        } finally {
          setIsLoadingImage(false);
        }
      } else {
        setLocalTicket(ticket);
      }
    };

    if (isOpen) {
      generateImageIfNeeded();
    }
  }, [ticket, isOpen]);

  if (!localTicket) {
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
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
            {isLoadingImage && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
            {!isLoadingImage && localTicket.imageUrl && (
              <Image
                  src={localTicket.imageUrl}
                  alt="Generated lottery ticket for Mother's Day"
                  fill
                  className="object-contain"
              />
            )}
            {!isLoadingImage && !localTicket.imageUrl && (
                <div className="text-center text-muted-foreground p-4">
                    Vista previa de la imagen no disponible.
                </div>
            )}
          </div>
          <div className="text-center font-bold text-lg">
            Ticket # {String(localTicket.id).padStart(3, '0')}
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Números:</h3>
            <div className="flex justify-center items-baseline gap-2 flex-wrap">
                 {localTicket.numbers.map((num, i) => (
                    <span key={i} className="font-mono text-2xl bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-md">
                      {String(num).padStart(3, '0')}
                    </span>
                  ))}
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="space-y-1">
                <p className="text-muted-foreground">Comprador</p>
                <p className="font-semibold">{localTicket.buyerName}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Contacto</p>
                <p className="font-semibold">{localTicket.buyerPhoneNumber}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Vendido por</p>
                <p className="font-semibold">{localTicket.sellerName || 'N/A'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-muted-foreground">Fecha de sorteo</p>
                <p className="font-semibold">{localTicket.drawingDate}</p>
             </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Forma de Pago</p>
                <p className="font-semibold">{localTicket.paymentMethod || 'N/A'}</p>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
