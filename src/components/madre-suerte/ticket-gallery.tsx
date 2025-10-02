
"use client";

import Image from "next/image";
import * as React from "react";
import type { Ticket, Seller } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { generateMotherSDayImage } from "@/ai/flows/generate-mother-s-day-image";
import { Loader2, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


interface TicketCardProps {
    ticket: Ticket;
    onClick: (ticket: Ticket) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
    const [imageUrl, setImageUrl] = React.useState(ticket.imageUrl);
    const [isLoading, setIsLoading] = React.useState(!ticket.imageUrl);

    React.useEffect(() => {
        const generateImage = async () => {
            if (!ticket.imageUrl && ticket.id) {
                try {
                    const result = await generateMotherSDayImage({
                        ticketId: String(ticket.id).padStart(3, '0'),
                        sellerName: ticket.sellerName,
                        buyerName: ticket.buyerName,
                        buyerPhoneNumber: ticket.buyerPhoneNumber,
                        numbers: ticket.numbers,
                    });
                    if (result.image) {
                        setImageUrl(result.image);
                    }
                } catch (error) {
                    console.error("Failed to generate image for gallery card:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        generateImage();
    }, [ticket]);

    const handleCardClick = () => {
        onClick({ ...ticket, imageUrl: imageUrl || '' });
    };

    return (
        <Card
            className="cursor-pointer hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full"
            onClick={handleCardClick}
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
            <CardContent className="p-4 flex-grow flex items-center justify-center min-h-[120px]">
                {isLoading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                {!isLoading && imageUrl && <Image src={imageUrl} alt={`Ticket ${ticket.id}`} width={200} height={120} className="rounded-md object-contain" />}
                {!isLoading && !imageUrl && <div className="text-xs text-muted-foreground">Vista previa no disponible</div>}
            </CardContent>
            <CardFooter className="flex flex-col items-center pt-4">
                <p className="text-sm text-muted-foreground">Vendido por:</p>
                <p className="font-semibold">{ticket.sellerName || 'N/A'}</p>
            </CardFooter>
        </Card>
    );
};


interface TicketGalleryProps {
  tickets: Ticket[];
  onCardClick: (ticket: Ticket) => void;
  sellers: Seller[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export function TicketGallery({ tickets, onCardClick, sellers, activeFilter, onFilterChange }: TicketGalleryProps) {
  const sortedTickets = [...tickets].sort((a,b) => parseInt(b.id) - parseInt(a.id));
  
  return (
    <section className="mt-16">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-center">
          Galería de tickets generados
        </h2>
        <div className="flex items-center gap-2">
            <Label htmlFor="seller-filter" className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                Filtrar por vendedor:
            </Label>
            <Select value={activeFilter} onValueChange={onFilterChange}>
                <SelectTrigger id="seller-filter" className="w-[180px]">
                    <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Mostrar Todos</SelectItem>
                    {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.name}>
                            {seller.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedTickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <TicketCard ticket={ticket} onClick={onCardClick} />
          </motion.div>
        ))}
      </div>
       {sortedTickets.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No hay tickets que coincidan con el filtro seleccionado.</p>
            </div>
       )}
    </section>
  );
}
