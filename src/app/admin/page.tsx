

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Prize, Seller, Winner } from '@/lib/types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Pencil, Shield, Menu, Home as HomeIcon, Users, BarChart, LogOut, Trophy, Ticket as TicketIcon, Save, Download, CreditCard } from 'lucide-react';
import { getTickets } from '@/app/actions/ticket-actions';
import { getPrizes, updatePrize, setWinningNumber, getWinnersData } from '@/app/actions/prize-actions';
import { getSellers, verifySession, clearSessionToken } from '@/app/actions/seller-actions';
import { generateWinnerImage } from '@/ai/flows/generate-winner-image';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';


const GENERIC_PRIZE_IMAGE_URL = "/generic-prize.jpg";

// Mock implementation of jsPDF and autoTable for client-side rendering
const jsPDF =
  typeof window !== 'undefined'
    ? require('jspdf').jsPDF
    : class jsPDF {
        save() {}
        autoTable() {}
      };

if (typeof window !== 'undefined') {
  require('jspdf-autotable');
}

interface AdminPrizeCardProps {
    prize: Prize;
    onEdit: (prize: Prize) => void;
    isAdmin: boolean;
}

function AdminPrizeCard({ prize, onEdit, isAdmin }: AdminPrizeCardProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        setImageSrc(prize.image_url || GENERIC_PRIZE_IMAGE_URL);
    }, [prize.image_url]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {`Premio ${prize.prize_order}`}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(prize)}>
                          <Pencil className="w-4 h-4"/>
                      </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-video relative w-full">
                    {!imageSrc ? (
                        <Skeleton className="h-full w-full" />
                    ) : (
                        <img
                            src={imageSrc}
                            alt={prize.title}
                            className="rounded-md mb-4 w-full h-auto object-cover aspect-video"
                        />
                    )}
                </div>
                <p className="font-semibold">Título:</p>
                <p>{prize.title}</p>
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [sellers, setSellers] = useState<Omit<Seller, 'password_hash'|'created_at'|'session_token'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [statsSellerFilter, setStatsSellerFilter] = useState('todos');
  const [statsPaymentFilter, setStatsPaymentFilter] = useState('todos');
  const router = useRouter();
  const [loggedInSeller, setLoggedInSeller] = useState<Seller | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State for winners tab
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [winningNumberInputs, setWinningNumberInputs] = useState<Record<number, string>>({});
  const [isExportingWinner, setIsExportingWinner] = useState<number | null>(null);


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

  const fetchWinnerData = React.useCallback(async () => {
        setLoadingWinners(true);
        try {
            const winnersData = await getWinnersData();
            setWinners(winnersData);
            
            // Initialize input fields with existing winning numbers
            const initialInputs: Record<number, string> = {};
            winnersData.forEach(w => {
                if (w.winning_number) {
                    initialInputs[w.id] = String(w.winning_number);
                }
            });
            setWinningNumberInputs(initialInputs);

        } catch (error) {
            console.error("Failed to fetch winners data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos de los ganadores.' });
        } finally {
            setLoadingWinners(false);
        }
    }, [toast]);


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
        
        const userIsAdmin = seller.role === 'admin';
        setIsAdmin(userIsAdmin);

        // Security redirect if a non-admin tries to access the page.
        if (!userIsAdmin) {
            toast({
                variant: "destructive",
                title: "Acceso Denegado",
                description: "No tienes permiso para ver esta página.",
            });
            router.push('/');
            return;
        }

    } catch (e) {
        console.error("Failed to parse seller data", e);
        handleLogout(true);
        return;
    }

    async function validateAndFetchData() {
        const isValid = await verifySession(seller.id, seller.session_token || null);
        if (!isValid) {
            handleLogout(true);
            return;
        }

        setLoading(true);
        try {
            const [dbTickets, dbPrizes, dbSellers] = await Promise.all([
                getTickets(),
                getPrizes(),
                getSellers(),
            ]);
            setTickets(dbTickets);
            setPrizes(dbPrizes);
            setSellers(dbSellers);
            await fetchWinnerData(); // Fetch winners data
        } catch (err) {
            console.error("Failed to load data", err);
            toast({
                variant: "destructive",
                title: "Error de Carga",
                description: "No se pudieron cargar los datos desde la base de datos."
            });
        } finally {
            setLoading(false);
        }
    }

    validateAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Ticket #', 'Vendido por', 'Comprador', 'Teléfono', 'Números', 'Forma de Pago']],
      body: tickets.map(ticket => [
        ticket.id,
        ticket.sellerName,
        ticket.buyerName,
        ticket.buyerPhoneNumber,
        ticket.numbers.join(', '),
        ticket.paymentMethod || 'N/A'
      ]),
    });
    doc.save('tickets_generados.pdf');
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize({ ...prize });
    setPreviewImage(prize.image_url); // Set initial preview
    setSelectedFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (editingPrize && isAdmin) {
      setIsSaving(true);
      
      let imageUrlToSave = editingPrize.image_url;
      if (selectedFile && previewImage) {
        imageUrlToSave = previewImage;
      }

      const result = await updatePrize(editingPrize.id, editingPrize.title, imageUrlToSave);
      setIsSaving(false);
      
      if (result.success) {
        const updatedPrizes = await getPrizes();
        setPrizes(updatedPrizes);
        
        toast({ title: "Éxito", description: result.message });
        setEditingPrize(null);
        setSelectedFile(null);
        setPreviewImage(null);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    }
  };
  
  const sortedTickets = [...tickets].sort((a,b) => parseInt(a.id) - parseInt(b.id));

  // --- Start Statistics Logic ---

  // Filter tickets based on both seller and payment method
  const filteredTicketsForStats = tickets.filter(ticket => {
      const sellerMatch = statsSellerFilter === 'todos' || ticket.sellerName === statsSellerFilter;
      const paymentMatch = statsPaymentFilter === 'todos' || ticket.paymentMethod === statsPaymentFilter;
      return sellerMatch && paymentMatch;
  });

  // Calculate stats for display (only sellers with sales, or the filtered one)
  const sellerStatsForDisplay = sellers.map(seller => {
      const sellerTickets = filteredTicketsForStats.filter(ticket => ticket.sellerName === seller.name);
      return {
          id: seller.id,
          name: seller.name,
          ticketsSold: sellerTickets.length,
          totalCollected: sellerTickets.length * 5000,
      };
  })
  .filter(seller => {
    if (statsSellerFilter !== 'todos') {
      return seller.name === statsSellerFilter;
    }
    return seller.ticketsSold > 0;
  })
  .sort((a, b) => b.ticketsSold - a.ticketsSold);

  // Calculate stats for PDF export (all sellers)
  const sellerStatsForExport = sellers.map(seller => {
    const sellerTickets = filteredTicketsForStats.filter(ticket => ticket.sellerName === seller.name);
    return {
        id: seller.id,
        name: seller.name,
        ticketsSold: sellerTickets.length,
        totalCollected: sellerTickets.length * 5000,
    };
  }).sort((a, b) => b.ticketsSold - a.ticketsSold);

  const totalAmountCollected = filteredTicketsForStats.reduce((sum) => sum + 5000, 0);

  const handleExportStatsPDF = () => {
    const doc = new jsPDF();
    const sellerFilterText = statsSellerFilter === 'todos' ? 'Todos' : statsSellerFilter;
    const paymentFilterText = statsPaymentFilter === 'todos' ? 'Todos' : statsPaymentFilter;
    
    doc.text(`Estadísticas de Venta`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Filtro Vendedor: ${sellerFilterText}`, 14, 22);
    doc.text(`Filtro Pago: ${paymentFilterText}`, 14, 27);
    
    doc.autoTable({
      startY: 32,
      head: [['Vendedor', 'Tickets Vendidos', 'Total Recaudado']],
      body: sellerStatsForExport.map(stat => [
        stat.name,
        stat.ticketsSold,
        `$${stat.totalCollected.toLocaleString('es-AR')}`
      ]),
      foot: [[
          'TOTAL FILTRADO',
          sellerStatsForExport.reduce((sum, stat) => sum + stat.ticketsSold, 0),
          `$${totalAmountCollected.toLocaleString('es-AR')}`
      ]],
      footStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' }
    });
    doc.save('estadisticas_venta.pdf');
  };

  // --- End Statistics Logic ---


  const handleWinningNumberChange = (prizeId: number, value: string) => {
    setWinningNumberInputs(prev => ({ ...prev, [prizeId]: value }));
  };

  const handleSaveWinningNumber = async (prizeId: number) => {
    const numberStr = winningNumberInputs[prizeId] ?? '';
    const number = numberStr ? parseInt(numberStr, 10) : null;
    
    if (numberStr && (isNaN(number!) || number! < 0 || number! > 999)) {
        toast({
            variant: "destructive",
            title: "Número inválido",
            description: "Por favor, ingresa un número entre 0 y 999."
        });
        return;
    }
    
    setIsSaving(true);
    const result = await setWinningNumber(prizeId, number);
    if (result.success) {
        toast({ variant: 'success', title: 'Guardado', description: 'Número ganador actualizado.' });
        await fetchWinnerData(); // Refresh winner data
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsSaving(false);
  };

  const handleExportWinnerCard = async (winnerData: Winner) => {
    if (!winnerData.winner_buyer_name || !winnerData.winning_number || !winnerData.winner_ticket_id || !winnerData.winner_ticket_numbers) {
        toast({
            variant: "destructive",
            title: "Datos incompletos",
            description: "Faltan datos del ganador para generar la tarjeta."
        });
        return;
    };

    setIsExportingWinner(winnerData.id);
    try {
        const result = await generateWinnerImage({
            prizeOrder: winnerData.prize_order,
            prizeTitle: winnerData.title,
            winningNumber: winnerData.winning_number,
            buyerName: winnerData.winner_buyer_name,
            ticketId: winnerData.winner_ticket_id,
            ticketNumbers: winnerData.winner_ticket_numbers,
        });

        if (result.image) {
            const link = document.createElement("a");
            link.href = result.image;
            link.download = `ganador_${winnerData.prize_order}_premio.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            throw new Error("La generación de la imagen no devolvió una imagen.");
        }
    } catch (error) {
        console.error("Error exporting winner card:", error);
        toast({
            variant: "destructive",
            title: "Error de Exportación",
            description: "No se pudo generar la tarjeta del ganador."
        });
    } finally {
        setIsExportingWinner(null);
    }
  };


  if (loading || !isAdmin) {
    return (
        <div className="container mx-auto p-4 md:p-8 flex justify-center items-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
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
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Panel de Administración</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleLogout(false)} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
            <Shield />
            Panel de Administración
        </h1>
        <p className="text-xl text-muted-foreground mt-2">Gestiona los premios, tickets y ganadores del sorteo.</p>
      </header>

      <Tabs>
        <TabList>
          <Tab>Tickets Asignados</Tab>
          {isAdmin && <Tab>Gestionar Premios</Tab>}
          {isAdmin && <Tab>Ganadores</Tab>}
          <Tab>Estadísticas</Tab>
        </TabList>

        <TabPanel>
          <Card>
            <CardHeader>
              <CardTitle>Tickets Generados</CardTitle>
              <CardDescription>
                Aquí puedes ver todos los tickets que se han generado para el sorteo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={handleExportPDF}>
                  <FileDown className="mr-2" />
                  Exportar a PDF
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Vendido por</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Números</TableHead>
                      <TableHead>Forma de Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTickets.map(ticket => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-semibold">{String(ticket.id).padStart(3, '0')}</TableCell>
                        <TableCell>{ticket.sellerName || 'N/A'}</TableCell>
                        <TableCell>{ticket.buyerName}</TableCell>
                        <TableCell>{ticket.buyerPhoneNumber}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {ticket.numbers.map((num, i) => (
                              <span key={i} className="font-mono bg-muted px-2 py-1 rounded-md">
                                {String(num).padStart(3, '0')}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{ticket.paymentMethod || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabPanel>
        
        {isAdmin && (
          <TabPanel>
            <Card>
              <CardHeader>
                  <CardTitle>Premios del Sorteo</CardTitle>
                  <CardDescription>
                      Aquí puedes editar la información de los premios. Los cambios se guardarán en la base de datos.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {prizes.map(prize => (
                        <AdminPrizeCard key={prize.id} prize={prize} onEdit={handleEditPrize} isAdmin={isAdmin} />
                      ))}
                  </div>
              </CardContent>
            </Card>
          </TabPanel>
        )}
        
        {isAdmin && (
          <TabPanel>
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Asignar Ganadores
                      </CardTitle>
                      <CardDescription>
                          Ingresa el número ganador para cada premio. El sistema encontrará al comprador.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                     {loadingWinners ? (
                         <div className="flex justify-center items-center p-8">
                             <Loader2 className="w-8 h-8 animate-spin text-primary" />
                         </div>
                     ) : (
                      winners.map(prize => (
                          <div key={prize.id}>
                              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-muted/50">
                                <div className="flex-grow text-center md:text-left">
                                  <h3 className="font-bold text-lg">{prize.prize_order}° Premio: <span className="font-normal">{prize.title}</span></h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`winner-input-${prize.id}`} className="text-sm font-medium">Nº Ganador:</Label>
                                    <Input 
                                      id={`winner-input-${prize.id}`}
                                      type="number"
                                      placeholder="XXXX"
                                      className="w-28 font-mono"
                                      value={winningNumberInputs[prize.id] || ''}
                                      onChange={(e) => handleWinningNumberChange(prize.id, e.target.value)}
                                      min="0"
                                      max="999"
                                    />
                                    <Button onClick={() => handleSaveWinningNumber(prize.id)} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                        Guardar
                                    </Button>
                                </div>
                              </div>

                              {prize.winning_number && (
                                <Card className={`mt-4 shadow-lg ${prize.winner_buyer_name ? 'border-primary' : 'border-destructive'}`}>
                                  <CardHeader className="flex flex-row justify-between items-start">
                                    <div>
                                        <CardTitle className={`${prize.winner_buyer_name ? 'text-primary' : 'text-destructive'} flex items-center gap-2`}>
                                        <Trophy className="w-5 h-5"/>
                                        {prize.winner_buyer_name ? `Ganador del ${prize.prize_order}° Premio` : `Número no encontrado`}
                                        </CardTitle>
                                        <CardDescription className="mt-1">{prize.title}</CardDescription>
                                    </div>
                                    {prize.winner_buyer_name && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportWinnerCard(prize)}
                                            disabled={isExportingWinner === prize.id}
                                        >
                                            {isExportingWinner === prize.id ? <Loader2 className="animate-spin" /> : <Download />}
                                            Exportar
                                        </Button>
                                    )}
                                  </CardHeader>
                                  <CardContent className="grid gap-4">
                                    {prize.winner_buyer_name ? (
                                      <>
                                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            <p><span className="font-semibold text-muted-foreground">Comprador:</span><br/> {prize.winner_buyer_name}</p>
                                            <p><span className="font-semibold text-muted-foreground">Teléfono:</span><br/> {prize.winner_buyer_phone}</p>
                                            <p><span className="font-semibold text-muted-foreground">Vendido por:</span><br/> {prize.winner_seller_name}</p>
                                          </div>
                                          <Separator />
                                          <div>
                                              <p className="font-semibold text-muted-foreground">Ticket Ganador #{String(prize.winner_ticket_id).padStart(3, '0')}</p>
                                              <p className="font-semibold text-muted-foreground mt-1">Tus números:</p>
                                              <div className="flex gap-2 mt-1">
                                                  {prize.winner_ticket_numbers?.map((num) => (
                                                      <span key={num} className={`font-mono px-2 py-1 rounded-md text-sm ${num === prize.winning_number ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                          {String(num).padStart(3, '0')