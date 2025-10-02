
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Prize } from "@/lib/types";
import { getPrizes } from "@/app/actions/prize-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GENERIC_PRIZE_IMAGE_URL = "/generic-prize.jpg";

export function PrizeList() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrizes() {
      try {
        const dbPrizes = await getPrizes();
        setPrizes(dbPrizes);
      } catch (error) {
        console.error("Failed to fetch prizes", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrizes();
  }, []);

  if (loading) {
    return (
        <section className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-8 flex items-center justify-center gap-3">
                <Gift className="w-8 h-8 text-accent"/>
                Nuestros Premios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                    <Card key={index}>
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <div className="aspect-video relative w-full">
                           <Skeleton className="h-full w-full" />
                        </div>
                        <CardContent className="p-4">
                           <Skeleton className="h-5 w-full mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-8 flex items-center justify-center gap-3">
        <Gift className="w-8 h-8 text-accent"/>
        Nuestros Premios
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prizes.map((prize) => (
          <Card key={prize.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
            <CardHeader>
              <CardTitle className="text-accent">{`Premio ${prize.prize_order}`}</CardTitle>
            </CardHeader>
            <div className="aspect-video relative w-full">
              <Image
                src={prize.image_url || GENERIC_PRIZE_IMAGE_URL}
                alt={prize.title}
                fill
                className="object-cover"
                onError={(e) => { e.currentTarget.src = GENERIC_PRIZE_IMAGE_URL; }}
              />
            </div>
            <CardContent className="p-4">
              <CardDescription className="text-lg text-center font-semibold text-card-foreground">{prize.title}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
