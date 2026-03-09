"use client";

import { ProductCard } from "@/components/catalog/product-card";
import type { CatalogProduct } from "@/lib/types";

interface CuratedGridProps {
  products: CatalogProduct[];
  isLoading: boolean;
}

export function CuratedGrid({ products, isLoading }: CuratedGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, j) => (
          <div
            key={j}
            className="h-[160px] animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">Nessun prodotto trovato.</p>
        <p className="mt-1 text-xs">
          Prova con una ricerca diversa.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
