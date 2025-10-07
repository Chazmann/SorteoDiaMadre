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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateSellerCredentials, getSellers, forceLoginAndCreateSession } from '@/app/actions/seller-actions';
import { Seller } from '@/lib/types';
import { Loader2, LogIn, Eye, EyeOff, Users, Check, ChevronsUpDown } from 'lucide-react';
import { HeartIcon } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  name: z.string().min(1, 'Debes seleccionar un vendedor.'),
  password: z.string().min(1, 'Debes ingresar tu contraseña.'),
});

type SimpleSeller = Omit<Seller, 'password_hash' | 'created_at' | 'session_token' | 'role'>;
type SessionActiveSeller = { id: number; name: string };

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [sellers, setSellers] = React.useState<SimpleSeller[]>([]);
  const [showSessionConflict, setShowSessionConflict] = React.useState(false);
  const [conflictSeller, setConflictSeller] = React.useState<SessionActiveSeller | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [comboboxOpen, setComboboxOpen] = React.useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      password: '',
    },
  });
  
  React.useEffect(() => {
    if (localStorage.getItem('loggedInSeller')) {
        router.push('/');
    }

    async function fetchSellers() {
        const sellerList = await getSellers();
        setSellers(sellerList);
    }
    fetchSellers();

  }, [router]);

  const handleLoginSuccess = (sellerData: Omit<Seller, 'password_hash' | 'created_at'>) => {
    localStorage.setItem('loggedInSeller', JSON.stringify(sellerData));
    toast({
      title: '¡Bienvenido/a!',
      description: `Has iniciado sesión como ${sellerData.name}.`,
    });
    router.push('/');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await validateSellerCredentials(
        values.name,
        values.password
      );

      if (response.status === 'success') {
        handleLoginSuccess(response.seller);
      } else if (response.status === 'session_active') {
        setConflictSeller(response.seller);
        setShowSessionConflict(true);
      } else { // 'invalid_credentials'
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

  const handleForceLogin = async () => {
    if (!conflictSeller) return;

    setIsLoading(true);
    setShowSessionConflict(false);

    try {
        const sellerData = await forceLoginAndCreateSession(conflictSeller.id);
        handleLoginSuccess(sellerData);
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error en el servidor',
            description: 'No se pudo forzar el inicio de sesión. Intenta de nuevo.',
        });
    } finally {
        setIsLoading(false);
        setConflictSeller(null);
    }
  };

  return (
    <>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Vendedor</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? sellers.find(
                                  (seller) => seller.name === field.value
                                )?.name
                              : "Selecciona un vendedor"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar vendedor..." />
                          <CommandList>
                            <CommandEmpty>No se encontró el vendedor.</CommandEmpty>
                            <CommandGroup>
                              {sellers.map((seller) => (
                                <CommandItem
                                  value={seller.name}
                                  key={seller.id}
                                  onSelect={() => {
                                    form.setValue("name", seller.name)
                                    setComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      seller.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {seller.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
    <AlertDialog open={showSessionConflict} onOpenChange={setShowSessionConflict}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Sesión Activa Detectada</AlertDialogTitle>
            <AlertDialogDescription>
                El vendedor "{conflictSeller?.name}" ya tiene una sesión activa en otro dispositivo. 
                ¿Deseas continuar aquí y cerrar la otra sesión?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictSeller(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceLogin}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
