"use client";

import Image from "next/image";
import type { Ticket } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TicketGalleryProps {
  tickets: Ticket[];
  onCardClick: (ticket: Ticket) => void;
}

export function TicketGallery({ tickets, onCardClick }: TicketGalleryProps) {
  const sortedTickets = [...tickets].sort((a,b) => parseInt(b.id) - parseInt(a.id));
  
  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-8">
        Galería de tickets generados
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedTickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full"
              onClick={() => onCardClick(ticket)}
            >
              <CardHeader>
                <CardTitle className="text-primary flex justify-center items-baseline gap-2 flex-wrap">
                  {ticket.numbers.map((num, i) => (
                    <span key={i} className="font-mono text-xl bg-muted px-2 py-1 rounded-md">
                      {String(num).padStart(3, '0')}
                    </span>
                  ))}
                </CardTitle>
                 <p className="text-center text-xs text-muted-foreground pt-1">Ticket #{String(ticket.id).padStart(3, '0')}</p>
              </CardHeader>
              <CardContent className="p-4 flex-grow flex items-center justify-center">
                 {ticket.imageUrl ? (
                    <Image src={ticket.imageUrl} alt={`Ticket ${ticket.id}`} width={200} height={120} className="rounded-md object-contain"/>
                 ) : (
                   <div className="text-center text-sm text-muted-foreground p-4">
                     Vista previa de imagen no disponible
                   </div>
                 )}
              </CardContent>
              <CardFooter className="flex flex-col items-center pt-4">
                <p className="text-sm text-muted-foreground">Vendido por:</p>
                <p className="font-semibold">{ticket.sellerName || 'N/A'}</p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
