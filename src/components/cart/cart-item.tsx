"use client";

import { X } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/types";
import { fmtPrice } from "@/lib/format";

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  return (
    <div className="mb-1.5 flex animate-cart-item-in items-center gap-2 rounded-[10px] border bg-card p-2 transition-colors hover:border-primary">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.75rem] font-semibold">
          {item.description}
        </div>
        <div className="truncate text-[0.65rem] text-muted-foreground">
          {item.supplier_code ? `${item.supplier_code} · ` : ""}
          {item.supplier_name} · {item.selling_uom}
        </div>
        <div className="text-[0.75rem] font-bold text-primary">
          {fmtPrice(item.price * item.qty)}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => onUpdateQty(item.qty - 1)}
          className="flex h-5 w-5 items-center justify-center rounded border text-[0.75rem] hover:border-primary hover:text-primary"
        >
          −
        </button>
        <span className="min-w-[18px] text-center text-[0.78rem] font-semibold">
          {item.qty}
        </span>
        <button
          onClick={() => onUpdateQty(item.qty + 1)}
          className="flex h-5 w-5 items-center justify-center rounded border text-[0.75rem] hover:border-primary hover:text-primary"
        >
          +
        </button>
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 p-0.5 text-muted-foreground opacity-40 transition-all hover:text-red-500 hover:opacity-100"
      >
        <X className="h-[13px] w-[13px]" />
      </button>
    </div>
  );
}
