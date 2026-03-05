"use client";

import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart-button";
import { fmtPrice } from "@/lib/format";
import type { CatalogProduct } from "@/lib/types";

interface ProductCardProps {
  product: CatalogProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-3 transition-colors hover:border-primary">
      <Badge
        variant="secondary"
        className="mb-1.5 w-fit text-[0.65rem] font-medium"
      >
        {product.supplier_name}
      </Badge>

      <p className="text-[0.82rem] font-semibold leading-snug line-clamp-2 min-h-[2.4em]">
        {product.description}
      </p>

      {product.selling_uom && (
        <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
          {product.selling_uom}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-[1.05rem] font-bold text-primary">
          {fmtPrice(product.price)}
        </span>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
