"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { QtyPopover } from "@/components/chat/qty-popover";
import type { CatalogProduct } from "@/lib/types";

interface AddToCartButtonProps {
  product: CatalogProduct;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  function handleAdded() {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const productData = {
    id: product.id,
    supplier_code: product.supplier_code,
    description: product.description,
    supplier_name: product.supplier_name,
    price: product.price,
    selling_uom: product.selling_uom,
  };

  return (
    <QtyPopover product={productData} onAdded={handleAdded}>
      <button
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:scale-105 ${
          added
            ? "border-primary bg-primary text-white"
            : "border-border bg-background text-primary hover:border-primary hover:bg-primary hover:text-white"
        }`}
        title="Aggiungi al carrello"
      >
        {added ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </button>
    </QtyPopover>
  );
}
