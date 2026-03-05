"use client";

import { ShoppingCart } from "lucide-react";

export function CartEmpty() {
  return (
    <div className="px-2 py-8 text-center text-[0.82rem] leading-relaxed text-muted-foreground">
      <ShoppingCart className="mx-auto mb-1 h-8 w-8 opacity-30" />
      Il carrello è vuoto.
      <br />
      Cerca prodotti e aggiungili qui.
    </div>
  );
}
