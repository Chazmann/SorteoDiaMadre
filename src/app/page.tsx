"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@/lib/types";
import { generateMotherSDayImage } from "@/ai/flows/generate-mother-s-day-image";
import { PrizeList } from "@/components/madre-suerte/prize-list";
import { TicketForm, type TicketFormValues } from "@/components/madre-suerte/ticket-form";
import { TicketGallery } from "@/components/madre-suerte/ticket-gallery";
import { TicketDetailsModal } from "@/components/madre-suerte/ticket-details-modal";
import { HeartIcon } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState(new Set<string>());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async (values: TicketFormValues) => {
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

    try {
      const result = await generateMotherSDayImage({
        ...values,
        numbers: newNumbers,
      });

      if (result.image) {
        const newTicket: Ticket = {
          id: `ticket-${Date.now()}`,
          ...values,
          numbers: newNumbers,
          imageUrl: result.image,
          drawingDate: "October 28, 2025",
        };
        setTickets(prevTickets => [newTicket, ...prevTickets]);
        setGeneratedNumbers(prev => new Set(prev).add(numbersKey));
        toast({
          title: "Success!",
          description: "Your lucky ticket has been generated.",
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
    setIsModalOpen(true);
  };

  const latestTicket = tickets[0];

  return (
    <>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <HeartIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary-foreground bg-primary px-4 py-2 rounded-lg shadow-lg">
              MadreSuerte
            </h1>
            <HeartIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mt-2">
            Sorteo Especial del Día de la Madre
          </p>
        </header>

        <PrizeList />

        <section className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <TicketForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            <div className="flex flex-col gap-4">
               <h2 className="text-2xl font-bold tracking-tight text-center lg:text-left">Your Generated Ticket</h2>
              <Card className="min-h-[300px] lg:min-h-[450px] w-full flex items-center justify-center animate-in fade-in duration-500">
                <CardContent className="p-4 w-full h-full">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-muted-foreground">Generating your lucky numbers...</p>
                      <Skeleton className="h-full w-full absolute" />
                    </div>
                  ) : latestTicket ? (
                    <div className="relative w-full h-full rounded-md overflow-hidden">
                       <Image
                          src={latestTicket.imageUrl}
                          alt="Generated lottery ticket for Mother's Day"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain"
                        />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground">
                        Fill out the form to generate your ticket image.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {tickets.length > 0 && (
          <TicketGallery tickets={tickets} onCardClick={handleCardClick} />
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} MadreSuerte. All rights reserved.</p>
      </footer>
      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
