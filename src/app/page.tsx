"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Gift, Menu, Home as HomeIcon, Shield, LogOut, Loader2 } from "lucide-react";
import { getTickets, createTicket, getUsedNumbers } from "@/app/actions/ticket-actions";
import { getSellers, verifySession, clearSessionToken } from "@/app/actions/seller-actions";


const MAX_TICKETS = 250;
const MAX_NUMBER = 999;

type TicketFormSubmitValues = {
    buyerName: string;
    buyerPhoneNumber: string;
    paymentMethod: string;
};

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sellers, setSellers] = useState<Omit<Seller, 'password_hash'|'created_at'|'session_token'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usedNumbers, setUsedNumbers] = useState(new Set<number>());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [activeSellerFilter, setActiveSellerFilter] = useState<string>('todos');
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInSeller, setLoggedInSeller] = useState<Seller | null>(null);
  
  const handleLogout = React.useCallback(async (isInvalidSession = false) => {
    if (loggedInSeller) {
      await clearSessionToken(loggedInSeller.id);
    }
    localStorage.removeItem('loggedInSeller');
    setLoggedInSeller(null);
    router.push('/login');
    if (isInvalidSession) {
         toast({
            variant: 'destructive',
            title: 'Sesión Expirada',
            description: 'Has iniciado sesión desde otro dispositivo.',
        });
    } else {
        toast({ title: 'Sesión cerrada', description: 'Has cerrado sesión correctamente.' });
    }
  }, [loggedInSeller, router, toast]);


  useEffect(() => {
    const sellerDataString = localStorage.getItem('loggedInSeller');
    if (!sellerDataString) {
      router.push('/login');
      return;
    }

    let seller: Seller;
    try {
        seller = JSON.parse(sellerDataString);
        setLoggedInSeller(seller);
    } catch (e) {
        console.error("Failed to parse seller data", e);
        handleLogout();
        return;
    }


    async function validateAndFetchData() {
        const isValid = await verifySession(seller.id, seller.session_token || null);
        if (!isValid) {
            handleLogout(true);
            return;
        }

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
    }
    
    validateAndFetchData();

  }, [router, toast, handleLogout]);

  const generateUniqueNumbers = (): number[] => {
    let newNumbers = new Set<number>();
    let attempts = 0;
    const MAX_ATTEMPTS = 1000;

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
    if (!loggedInSeller || !loggedInSeller.session_token) {
      toast({ variant: "destructive", title: "Error", description: "Sesión no válida. Por favor, inicia sesión de nuevo." });
      handleLogout(true);
      return false;
    }

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
          sellerId: loggedInSeller.id, 
          sellerToken: loggedInSeller.session_token,
          buyerName: values.buyerName, 
          buyerPhoneNumber: values.buyerPhoneNumber,
          numbers: newNumbers,
          paymentMethod: values.paymentMethod,
      });

      const result = await generateMotherSDayImage({
        sellerName: loggedInSeller.name,
        buyerName: values.buyerName,
        buyerPhoneNumber: values.buyerPhoneNumber,
        numbers: newNumbers,
        ticketId: String(newTicketId).padStart(3, '0'),
      });
      
      if (result.image) {
        const newTicket: Ticket = {
          id: String(newTicketId),
          sellerName: loggedInSeller.name,
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
          variant: "success",
          title: "¡Suerte!",
          description: "Tu ticket de la suerte ha sido generado.",
        });
        return true; // Success
      } else {
        throw new Error("Image generation failed.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === 'invalid_session') {
        handleLogout(true);
        return false;
      }

      const isDuplicateError = error.message === 'duplicate_number';
      toast({
        variant: "destructive",
        title: isDuplicateError ? "Número Duplicado" : "Falló la Creación del Ticket",
        description: isDuplicateError ? "Uno de los números generados ya fue tomado. Por favor, genera una nueva combinación." : "Hubo un error al guardar tu ticket. Intenta de nuevo.",
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
  
  if (!loggedInSeller) {
    return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

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
             <DropdownMenuItem onClick={() => setIsPrizeModalOpen(true)}>
                <Gift className="mr-2 h-4 w-4" />
                <span>Ver Premios</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleLogout(false)} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <HeartIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary-foreground bg-primary px-4 py-2 rounded-lg shadow-lg">
              Sorteo día de la Madre - 7mo 1ra
            </h1>
            <HeartIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="cardHeader text-xl md:text-2xl text-muted-foreground mt-2">
            Bienvenido/a, <span className="font-bold text-primary">{loggedInSeller.name}</span>.
          </p>
        </header>

        <div className="hidden md:block">
          <PrizeList />
        </div>

        <section className="mt-12">
          <div className="max-w-lg mx-auto">
            <TicketForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              generateUniqueNumbers={generateUniqueNumbers}
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
