"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, Seller } from "@/lib/types";
import { generateMotherSDayImage } from "@/ai/flows/generate-mother-s-day-image";
import { PrizeList } from "@/components/madre-suerte/prize-list";
import { TicketForm } from "@/components/madre-suerte/ticket-form";
import { TicketGallery } from "@/components/madre-suerte/ticket-gallery";
import { TicketDetailsModal } from "@/components/madre-suerte/ticket-details-modal";
import { HeartIcon } from "@/components/icons";
import { PrizeModal } from "@/components/madre-suerte/prize-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gift, Menu, Home as HomeIcon, Shield } from "lucide-react";
import { getTickets, createTicket, getUsedNumbers } from "@/app/actions/ticket-actions";
import { getSellers } from "@/app/actions/seller-actions";


const MAX_TICKETS = 250;
const MAX_NUMBER = 999;

type TicketFormSubmitValues = {
    sellerId: number;
    buyerName: string;
    buyerPhoneNumber: string;
    paymentMethod: string;
};

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usedNumbers, setUsedNumbers] = useState(new Set<number>());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [activeSellerFilter, setActiveSellerFilter] = useState<string>('todos');
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dbTickets, dbUsedNumbers, dbSellers] = await Promise.all([
          getTickets(),
          getUsedNumbers(),
          getSellers(),
        ]);
        setTickets(dbTickets);
        setUsedNumbers(dbUsedNumbers);
        setSellers(dbSellers);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          variant: "destructive",
          title: "Error de Carga",
          description: "No se pudieron cargar los datos de la base de datos.",
        });
      }
    };
    fetchInitialData();
  }, [toast]);

  const generateUniqueNumbers = (): number[] => {
    let newNumbers = new Set<number>();
    let attempts = 0;
    const MAX_ATTEMPTS = 1000; // Increase attempts for safety

    while (newNumbers.size < 4 && attempts < MAX_ATTEMPTS) {
        const randomNumber = Math.floor(Math.random() * (MAX_NUMBER + 1));
        if (!usedNumbers.has(randomNumber) && !newNumbers.has(randomNumber)) {
            newNumbers.add(randomNumber);
        }
        attempts++;
    }

    if (newNumbers.size < 4) {
        toast({
            variant: "destructive",
            title: "Error de Generación",
            description: "No se pudieron generar 4 números únicos. Es posible que ya no haya números disponibles.",
        });
        throw new Error("Could not generate a unique set of numbers.");
    }
    
    return Array.from(newNumbers);
  };

  const handleFormSubmit = async (values: TicketFormSubmitValues, newNumbers: number[]): Promise<boolean> => {
    if (tickets.length >= MAX_TICKETS) {
      toast({
        variant: "destructive",
        title: "Límite alcanzado",
        description: `Se ha alcanzado el límite de ${MAX_TICKETS} tickets.`,
      });
      return false;
    }

    setIsLoading(true);

    try {
      const newTicketId = await createTicket({ 
          sellerId: values.sellerId, 
          buyerName: values.buyerName, 
          buyerPhoneNumber: values.buyerPhoneNumber,
          numbers: newNumbers,
          paymentMethod: values.paymentMethod,
      });
      
      const seller = sellers.find(s => s.id === values.sellerId);
      if (!seller) {
        throw new Error("Vendedor no encontrado. No se puede generar la imagen del ticket.");
      }

      const result = await generateMotherSDayImage({
        sellerName: seller.name,
        buyerName: values.buyerName,
        buyerPhoneNumber: values.buyerPhoneNumber,
        numbers: newNumbers,
        ticketId: String(newTicketId).padStart(3, '0'),
      });
      
      if (result.image) {
        const newTicket: Ticket = {
          id: String(newTicketId),
          sellerName: seller.name,
          buyerName: values.buyerName,
          buyerPhoneNumber: values.buyerPhoneNumber,
          numbers: newNumbers,
          imageUrl: result.image,
          drawingDate: "October 28, 2025",
          paymentMethod: values.paymentMethod,
        };
        setTickets(prevTickets => [newTicket, ...prevTickets]);
        const updatedUsedNumbers = new Set(usedNumbers);
        newNumbers.forEach(num => updatedUsedNumbers.add(num));
        setUsedNumbers(updatedUsedNumbers);
        toast({
          title: "¡Suerte!",
          description: "Tu ticket de la suerte ha sido generado.",
        });
        return true; // Success
      } else {
        throw new Error("Image generation failed.");
      }
    } catch (error: any) {
      console.error(error);
      const isDuplicateError = error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry') || error.message?.includes('UNIQUE constraint failed');
      toast({
        variant: "destructive",
        title: isDuplicateError ? "Número Duplicado" : "Falló la Creación del Ticket",
        description: isDuplicateError ? "Uno de los números generados ya fue tomado. Por favor, genera una nueva combinación." : "Hubo un error al guardar tu ticket en la base de datos. Intenta de nuevo.",
      });
      return false; // Failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };
  
  const filteredTickets = activeSellerFilter === 'todos' 
    ? tickets 
    : tickets.filter(ticket => ticket.sellerName === activeSellerFilter);

  return (
    <>
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                <span>Inicio</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                <span>Panel de Administración</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <HeartIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary-foreground bg-primary px-4 py-2 rounded-lg shadow-lg">
              Madre Suerte - 7mo 1ra
            </h1>
            <HeartIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mt-2">
            Sorteo Especial del Día de la Madre
          </p>
        </header>

        {/* Hidden on mobile, visible on desktop */}
        <div className="hidden md:block">
          <PrizeList />
        </div>

        {/* Visible only on mobile */}
        <div className="md:hidden text-center mb-8">
          <Button onClick={() => setIsPrizeModalOpen(true)}>
            <Gift className="mr-2" />
            Ver Premios
          </Button>
        </div>

        <section className="mt-12">
          <div className="max-w-lg mx-auto">
            <TicketForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              generateUniqueNumbers={generateUniqueNumbers}
              sellers={sellers}
            />
          </div>
        </section>

        {tickets.length > 0 && (
          <TicketGallery 
            tickets={filteredTickets} 
            onCardClick={handleCardClick}
            sellers={sellers}
            activeFilter={activeSellerFilter}
            onFilterChange={setActiveSellerFilter}
          />
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MadreSuerte. All rights reserved.</p>
        <Link href="/admin" className="text-sm text-primary hover:underline">Panel de Administración</Link>
      </footer>
      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onOpenChange={setIsTicketModalOpen}
      />
      <PrizeModal
        isOpen={isPrizeModalOpen}
        onOpenChange={setIsPrizeModalOpen}
      />
    </>
  );
}
