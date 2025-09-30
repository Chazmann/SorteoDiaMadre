
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
         <div className="max-h-[80vh] overflow-y-auto p-4">
            <PrizeList />
         </div>
      </DialogContent>
    </Dialog>
  );
}
