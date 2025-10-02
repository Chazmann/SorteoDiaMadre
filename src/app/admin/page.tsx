
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Prize } from '@/lib/types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Pencil, Shield, Menu, Home as HomeIcon } from 'lucide-react';
import { getTickets } from '@/app/actions/ticket-actions';
import { getPrizes, updatePrize } from '@/app/actions/prize-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';


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
}

function AdminPrizeCard({ prize, onEdit }: AdminPrizeCardProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        // Set the image source on the client side to avoid hydration issues with Data URLs
        setImageSrc(prize.image_url || GENERIC_PRIZE_IMAGE_URL);
    }, [prize.image_url]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {`Premio ${prize.prize_order}`}
                    <Button variant="ghost" size="icon" onClick={() => onEdit(prize)}>
                        <Pencil className="w-4 h-4"/>
                    </Button>
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
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [dbTickets, dbPrizes] = await Promise.all([
                getTickets(),
                getPrizes()
            ]);
            setTickets(dbTickets);
            setPrizes(dbPrizes);
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
    fetchData();
  }, [toast]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Ticket #', 'Vendido por', 'Comprador', 'Teléfono', 'Números']],
      body: tickets.map(ticket => [
        ticket.id,
        ticket.sellerName,
        ticket.buyerName,
        ticket.buyerPhoneNumber,
        ticket.numbers.join(', '),
      ]),
    });
    doc.save('tickets.pdf');
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
    if (editingPrize) {
      setIsSaving(true);
      
      let imageUrlToSave = editingPrize.image_url;
      if (selectedFile && previewImage) {
        imageUrlToSave = previewImage;
      }

      const result = await updatePrize(editingPrize.id, editingPrize.title, imageUrlToSave);
      setIsSaving(false);
      
      if (result.success) {
        // Fetch prizes again to get the latest data including the updated one
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

  if (loading) {
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
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                <span>Panel de Administración</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
            <Shield />
            Panel de Administración
        </h1>
        <p className="text-xl text-muted-foreground mt-2">Gestiona los premios y los tickets del sorteo.</p>
      </header>

      <Tabs>
        <TabList>
          <Tab>Tickets Asignados</Tab>
          <Tab>Gestionar Premios</Tab>
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
                      <TableHead>Números Asignados</TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabPanel>
        
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
                       <AdminPrizeCard key={prize.id} prize={prize} onEdit={handleEditPrize} />
                    ))}
                </div>
             </CardContent>
          </Card>
        </TabPanel>
      </Tabs>

      {editingPrize && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Editar Premio</CardTitle>
                    <CardDescription>Modifica la información del premio seleccionado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <label className="text-sm font-medium">Título del Premio</label>
                        <Input 
                            value={editingPrize.title} 
                            onChange={(e) => setEditingPrize({...editingPrize, title: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-sm font-medium">Imagen del Premio</label>
                        <Input 
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                     </div>
                     {previewImage && (
                        <div>
                          <p className="text-sm font-medium mb-2">Vista Previa:</p>
                          <img src={previewImage} alt="Vista previa" className="rounded-md w-full h-auto object-cover aspect-video"/>
                        </div>
                     )}
                     <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingPrize(null)}>Cancelar</Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar Cambios
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

// React-tabs requires some specific CSS. We can add it here.
const adminPageStyle = `
  .react-tabs__tab-list {
    border-bottom: 1px solid #aaa;
    margin: 0 0 10px;
    padding: 0;
  }

  .react-tabs__tab {
    display: inline-block;
    border: 1px solid transparent;
    border-bottom: none;
    bottom: -1px;
    position: relative;
    list-style: none;
    padding: 6px 12px;
    cursor: pointer;
  }

  .react-tabs__tab--selected {
    background: #fff;
    border-color: #aaa;
    color: black;
    border-radius: 5px 5px 0 0;
  }

  .dark .react-tabs__tab--selected {
     background: hsl(var(--card));
     border-color: hsl(var(--border));
     color: hsl(var(--card-foreground));
  }

  .react-tabs__tab:focus {
    box-shadow: 0 0 5px hsl(var(--ring));
    border-color: hsl(var(--ring));
    outline: none;
  }
`;

const styleSheet = typeof document !== 'undefined' ? document.createElement("style") : null;
if (styleSheet) {
    styleSheet.type = "text/css";
    styleSheet.innerText = adminPageStyle;
    document.head.appendChild(styleSheet);
}

    
