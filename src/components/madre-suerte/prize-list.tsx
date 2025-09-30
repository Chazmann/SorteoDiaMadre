"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift } from "lucide-react";

export function PrizeList() {
  const prizes = PlaceHolderImages.filter(img => img.id.startsWith("prize-"));
  const prizeTitles = ["Primer Premio", "Segundo Premio", "Tercer Premio"];

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold tracking-tight text-center mb-8 flex items-center justify-center gap-3">
        <Gift className="w-8 h-8 text-accent"/>
        Nuestros Premios
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {prizes.map((prize, index) => (
          <Card key={prize.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-accent">{prizeTitles[index] || `Premio ${index + 1}`}</CardTitle>
            </CardHeader>
            <div className="aspect-video relative w-full">
              <Image
                src={prize.imageUrl}
                alt={prize.description}
                fill
                className="object-cover"
                data-ai-hint={prize.imageHint}
              />
            </div>
            <CardContent className="p-4">
              <CardDescription className="text-lg text-center font-semibold">{prize.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
