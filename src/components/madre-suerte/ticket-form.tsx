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
import { Loader2, Ticket as TicketIcon } from "lucide-react";

const formSchema = z.object({
  sellerName: z.string().min(2, "Seller name must be at least 2 characters."),
  buyerName: z.string().min(2, "Buyer name must be at least 2 characters."),
  buyerPhoneNumber: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Please enter a valid phone number."),
});

export type TicketFormValues = z.infer<typeof formSchema>;

interface TicketFormProps {
  onSubmit: (values: TicketFormValues) => void;
  isLoading: boolean;
}

export function TicketForm({ onSubmit, isLoading }: TicketFormProps) {
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerName: "",
      buyerName: "",
      buyerPhoneNumber: "",
    },
  });

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mezclando los números...
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
