"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCart } from "@/hooks/use-cart";
import type { ProductData } from "@/lib/types";

interface QtyPopoverProps {
  product: ProductData;
  onAdded?: () => void;
  children: React.ReactNode;
}

export function QtyPopover({ product, onAdded, children }: QtyPopoverProps) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    addToCart({
      id: product.id || `p-${Math.random().toString(36).substring(2, 11)}`,
      supplier_code: product.supplier_code ?? "",
      description: product.description,
      supplier_name: product.supplier_name,
      price: product.price,
      selling_uom: product.selling_uom,
      qty,
    });
    setOpen(false);
    setQty(1);
    onAdded?.();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="flex w-auto items-center gap-1.5 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md border text-sm hover:border-primary hover:text-primary"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-[38px] rounded-md border bg-background text-center text-[0.82rem]"
        />
        <button
          onClick={() => setQty((q) => q + 1)}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md border text-sm hover:border-primary hover:text-primary"
        >
          +
        </button>
        <button
          onClick={handleConfirm}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
        >
          <ShoppingCart className="h-[15px] w-[15px]" />
        </button>
      </PopoverContent>
    </Popover>
  );
}
