"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { QtyPopover } from "./qty-popover";
import type { ProductData } from "@/lib/types";

interface InlineCartButtonProps {
  product: ProductData;
}

export function InlineCartButton({ product }: InlineCartButtonProps) {
  const [added, setAdded] = useState(false);

  function handleAdded() {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <QtyPopover product={product} onAdded={handleAdded}>
      <button
        className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition-all hover:scale-110 ${
          added
            ? "border-primary bg-primary text-white"
            : "border-border bg-background text-primary hover:border-primary hover:bg-primary hover:text-white"
        }`}
        title="Aggiungi al carrello"
      >
        {added ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ShoppingCart className="h-3.5 w-3.5" />
        )}
      </button>
    </QtyPopover>
  );
}
