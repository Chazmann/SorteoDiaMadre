'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateSellerCredentials, getSellers } from '@/app/actions/seller-actions';
import { Seller } from '@/lib/types';
import { Loader2, LogIn, Eye, EyeOff, Users } from 'lucide-react';
import { HeartIcon } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  name: z.string().min(1, 'Debes seleccionar un vendedor.'),
  password: z.string().min(1, 'Debes ingresar tu contraseña.'),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [sellers, setSellers] = React.useState<Seller[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  });
  
  React.useEffect(() => {
    // Si ya hay una sesión, redirigir a la página principal
    if (localStorage.getItem('loggedInSeller')) {
        router.push('/');
    }

    async function fetchSellers() {
        const sellerList = await getSellers();
        setSellers(sellerList);
    }
    fetchSellers();

  }, [router]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const seller = await validateSellerCredentials(
        values.name,
        values.password
      );

      if (seller) {
        localStorage.setItem('loggedInSeller', JSON.stringify(seller));
        toast({
          title: '¡Bienvenido/a!',
          description: `Has iniciado sesión como ${seller.name}.`,
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de autenticación',
          description: 'El usuario o la contraseña son incorrectos.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error en el servidor',
        description: 'No se pudo verificar la autenticación. Intenta de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <HeartIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary-foreground bg-primary px-4 py-2 rounded-lg shadow-lg">
              Sorteo día de la Madre
            </h1>
            <HeartIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mt-2">
            7mo 1ra
          </p>
        </header>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LogIn /> Iniciar Sesión
          </CardTitle>
          <CardDescription>Ingresa tu usuario y contraseña para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                       <FormControl>
                        <SelectTrigger>
                           <Users className="w-4 h-4 mr-2" />
                           <SelectValue placeholder="Selecciona tu nombre..." />
                        </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         {sellers.map((seller) => (
                            <SelectItem key={seller.id} value={seller.name}>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          {...field}
                          className="pr-10" 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}