
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Ticket } from '@/lib/types';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Pencil, Shield } from 'lucide-react';

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

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [prizes, setPrizes] = useState<ImagePlaceholder[]>([]);
  const [editingPrize, setEditingPrize] = useState<ImagePlaceholder | null>(null);

  useEffect(() => {
    const savedTickets = localStorage.getItem('tickets');
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets));
    }
    setPrizes(PlaceHolderImages.filter(img => img.id.startsWith('prize-')));
  }, []);

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

  const handleEditPrize = (prize: ImagePlaceholder) => {
    setEditingPrize({ ...prize });
  };

  const handleSaveChanges = () => {
    if (editingPrize) {
      // In a real app, you would have an API call here to save the changes.
      // For this mock, we'll just update the state and show an alert.
      setPrizes(prizes.map(p => (p.id === editingPrize.id ? editingPrize : p)));
      alert('Cambios guardados (simulado). En una app real, esto se guardaría en la base de datos.');
      setEditingPrize(null);
    }
  };
  
  const sortedTickets = [...tickets].sort((a,b) => parseInt(a.id) - parseInt(b.id));


  return (
    <div className="container mx-auto p-4 md:p-8">
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
                        <TableCell className="font-semibold">{ticket.id}</TableCell>
                        <TableCell>{ticket.sellerName}</TableCell>
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
                    Aquí puedes editar la información de los premios. Los cambios son solo demostrativos.
                </CardDescription>
             </CardHeader>
             <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {prizes.map(prize => (
                        <Card key={prize.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {prize.id.replace('prize-','').toUpperCase()}
                                    <Button variant="ghost" size="icon" onClick={() => handleEditPrize(prize)}>
                                        <Pencil className="w-4 h-4"/>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <img src={prize.imageUrl} alt={prize.description} className="rounded-md mb-4 w-full h-auto object-cover aspect-video"/>
                                <p className="font-semibold">Título:</p>
                                <p>{prize.description}</p>
                            </CardContent>
                        </Card>
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
                            value={editingPrize.description} 
                            onChange={(e) => setEditingPrize({...editingPrize, description: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-sm font-medium">URL de la Imagen</label>
                        <Input 
                            value={editingPrize.imageUrl}
                            onChange={(e) => setEditingPrize({...editingPrize, imageUrl: e.target.value})}
                        />
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingPrize(null)}>Cancelar</Button>
                        <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
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
