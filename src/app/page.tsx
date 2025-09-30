
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@/lib/types";
import { generateMotherSDayImage } from "@/ai/flows/generate-mother-s-day-image";
import { PrizeList } from "@/components/madre-suerte/prize-list";
import { TicketForm, type TicketFormValues } from "@/components/madre-suerte/ticket-form";
import { TicketGallery } from "@/components/madre-suerte/ticket-gallery";
import { TicketDetailsModal } from "@/components/madre-suerte/ticket-details-modal";
import { HeartIcon } from "@/components/icons";
import { PrizeModal } from "@/components/madre-suerte/prize-modal";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

const MAX_TICKETS = 250;

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState(new Set<string>());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Save tickets to localStorage whenever they change
    if (tickets.length > 0) {
      localStorage.setItem("tickets", JSON.stringify(tickets));
    }
  }, [tickets]);

  useEffect(() => {
    // Load tickets from localStorage on initial render
    const savedTickets = localStorage.getItem("tickets");
    if (savedTickets) {
      const parsedTickets: Ticket[] = JSON.parse(savedTickets);
      setTickets(parsedTickets);
      const numbersKeys = new Set(
        parsedTickets.map(t => [...t.numbers].sort((a,b) => a-b).join(','))
      );
      setGeneratedNumbers(numbersKeys);
    }
  }, []);

  const handleFormSubmit = async (values: TicketFormValues) => {
    if (tickets.length >= MAX_TICKETS) {
      toast({
        variant: "destructive",
        title: "Límite alcanzado",
        description: `Se ha alcanzado el límite de ${MAX_TICKETS} tickets.`,
      });
      return;
    }
    
    setIsLoading(true);

    const generateUniqueNumbers = (): number[] => {
      const numbers = new Set<number>();
      while (numbers.size < 4) {
        numbers.add(Math.floor(Math.random() * 1000));
      }
      return Array.from(numbers);
    };

    let newNumbers: number[];
    let numbersKey: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    do {
      newNumbers = generateUniqueNumbers();
      numbersKey = [...newNumbers].sort((a, b) => a - b).join(',');
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not generate a unique set of numbers. Please try again.",
        });
        setIsLoading(false);
        return;
      }
    } while (generatedNumbers.has(numbersKey));

    const nextTicketId = String(tickets.length + 1).padStart(3, '0');

    try {
      const result = await generateMotherSDayImage({
        ...values,
        numbers: newNumbers,
        ticketId: nextTicketId,
      });

      if (result.image) {
        const newTicket: Ticket = {
          id: nextTicketId,
          ...values,
          numbers: newNumbers,
          imageUrl: result.image,
          drawingDate: "October 28, 2025",
        };
        setTickets(prevTickets => [newTicket, ...prevTickets]);
        setGeneratedNumbers(prev => new Set(prev).add(numbersKey));
        toast({
          title: "Suerte!",
          description: "Tu ticket de la suerte ha sido generado.",
        });
      } else {
        throw new Error("Image generation failed.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating your image. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  return (
    <>
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
                <Gift className="mr-2"/>
                Ver Premios
            </Button>
        </div>


        <section className="mt-12">
           <div className="max-w-lg mx-auto">
            <TicketForm onSubmit={handleFormSubmit} isLoading={isLoading} />
           </div>
        </section>

        {tickets.length > 0 && (
          <TicketGallery tickets={tickets} onCardClick={handleCardClick} />
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
