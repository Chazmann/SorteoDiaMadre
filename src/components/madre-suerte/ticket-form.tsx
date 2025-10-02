"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from 'react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Ticket as TicketIcon, Dices, CreditCard } from "lucide-react";
import { Seller } from "@/lib/types";

const formSchema = z.object({
  sellerId: z.string().min(1, "Debes seleccionar un vendedor."),
  buyerName: z.string().min(2, "El nombre del comprador debe tener al menos 2 caracteres."),
  buyerPhoneNumber: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "INGRESAR UN NÚMERO VÁLIDO."),
  paymentMethod: z.string().min(1, "Debes seleccionar una forma de pago."),
});

export type TicketFormValues = z.infer<typeof formSchema>;

interface TicketFormProps {
  onSubmit: (values: {
    sellerId: number;
    buyerName: string;
    buyerPhoneNumber: string;
    paymentMethod: string;
  }, numbers: number[]) => Promise<boolean>; // Returns a promise with a boolean indicating success
  isLoading: boolean;
  generateUniqueNumbers: () => number[];
  sellers: Seller[];
}

export function TicketForm({ onSubmit, isLoading, generateUniqueNumbers, sellers }: TicketFormProps) {
  const [generatedNumbers, setGeneratedNumbers] = React.useState<number[] | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      buyerName: "",
      buyerPhoneNumber: "",
      paymentMethod: "",
    },
  });

  const handleGenerateNumbers = () => {
    try {
        const newNumbers = generateUniqueNumbers();
        setGeneratedNumbers(newNumbers);
    } catch(e) {
        // Toast is already shown in the generateUniqueNumbers function
        console.error(e);
    }
  };
  
  const handleFormSubmit = async (values: TicketFormValues) => {
    if (generatedNumbers) {
      const success = await onSubmit({ 
          buyerName: values.buyerName,
          buyerPhoneNumber: values.buyerPhoneNumber,
          sellerId: parseInt(values.sellerId),
          paymentMethod: values.paymentMethod,
      }, generatedNumbers);
      
      // Only reset the form and numbers if the submission was successful
      if (success) {
        setGeneratedNumbers(null);
        form.reset();
      } else {
        // If submission failed (e.g., duplicate numbers), just clear the generated numbers
        // so the user has to generate a new set. The form fields remain filled.
        setGeneratedNumbers(null);
      }
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
              name="sellerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Vendedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un vendedor..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={String(seller.id)}>
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                         <CreditCard className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Selecciona una forma de pago..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mercado Pago">Mercado Pago</SelectItem>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
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
            
            <Button type="submit" disabled={isLoading || !generatedNumbers || sellers.length === 0} className="w-full" size="lg">
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
