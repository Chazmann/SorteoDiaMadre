
"use client";

import { PrizeList } from "./prize-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PrizeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrizeModal({ isOpen, onOpenChange }: PrizeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
         <DialogHeader>
            <DialogTitle>Premios del Sorteo</DialogTitle>
            <DialogDescription>
                Una lista de los premios disponibles para el sorteo del Día de la Madre.
            </DialogDescription>
        </DialogHeader>
         <div className="max-h-[80vh] overflow-y-auto p-4">
            <PrizeList />
         </div>
      </DialogContent>
    </Dialog>
  );
}
