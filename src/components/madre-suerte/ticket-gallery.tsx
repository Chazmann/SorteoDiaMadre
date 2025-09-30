"use client";

import type { Ticket } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TicketGalleryProps {
  tickets: Ticket[];
  onCardClick: (ticket: Ticket) => void;
}

export function TicketGallery({ tickets, onCardClick }: TicketGalleryProps) {
  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-8">
        Generated Tickets Gallery
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => onCardClick(ticket)}
            >
              <CardHeader>
                <CardTitle className="text-primary flex justify-center items-baseline gap-2 flex-wrap">
                  {ticket.numbers.map((num, i) => (
                    <span key={i} className="font-mono text-2xl bg-muted px-2 py-1 rounded-md">
                      {String(num).padStart(3, '0')}
                    </span>
                  ))}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0"></CardContent>
              <CardFooter className="flex flex-col items-center pt-4">
                <p className="text-sm text-muted-foreground">Seller:</p>
                <p className="font-semibold">{ticket.sellerName}</p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
