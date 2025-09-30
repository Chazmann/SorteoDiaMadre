
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket as TicketIcon, Dices } from "lucide-react";
import * as React from 'react';

const formSchema = z.object({
  sellerName: z.string().min(2, "El nombre del vendedor debe tener al menos 2 caracteres."),
  buyerName: z.string().min(2, "El nombre del comprador debe tener al menos 2 caracteres."),
  buyerPhoneNumber: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "INGRESAR UN NÚMERO VÁLIDO."),
});

export type TicketFormValues = z.infer<typeof formSchema>;

interface TicketFormProps {
  onSubmit: (values: TicketFormValues, numbers: number[]) => void;
  isLoading: boolean;
  generateUniqueNumbers: () => number[];
}

export function TicketForm({ onSubmit, isLoading, generateUniqueNumbers }: TicketFormProps) {
  const [generatedNumbers, setGeneratedNumbers] = React.useState<number[] | null>(null);
  
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerName: "",
      buyerName: "",
      buyerPhoneNumber: "",
    },
  });

  const handleGenerateNumbers = () => {
    const newNumbers = generateUniqueNumbers();
    setGeneratedNumbers(newNumbers);
  };
  
  const handleFormSubmit = (values: TicketFormValues) => {
    if (generatedNumbers) {
      onSubmit(values, generatedNumbers);
      setGeneratedNumbers(null);
      form.reset();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-primary"/>
            Generar ticket
        </CardTitle>
        <CardDescription>
          Ingresar los detalles para generar un ticket de lotería único para el sorteo de la Madre.
               </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="sellerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Vendedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Leandro Chaz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprador</FormLabel>
                  <FormControl>
                    <Input placeholder="Cosme Fulanito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyerPhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contacto del comprador</FormLabel>
                  <FormControl>
                    <Input placeholder="+541123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {generatedNumbers && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Números de la suerte generados:</p>
                <div className="flex justify-center items-baseline gap-2 flex-wrap">
                  {generatedNumbers.map((num, i) => (
                    <span key={i} className="font-mono text-2xl bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-md">
                      {String(num).padStart(3, '0')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button type="button" variant="secondary" onClick={handleGenerateNumbers} className="w-full">
              <Dices className="mr-2" />
              {generatedNumbers ? "Generar otros números" : "Generar números de la suerte"}
            </Button>
            
            <Button type="submit" disabled={isLoading || !generatedNumbers} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando su ticket...
                </>
              ) : (
                "Generar Ticket"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
