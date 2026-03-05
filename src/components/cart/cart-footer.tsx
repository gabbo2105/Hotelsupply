"use client";

import { useState } from "react";
import { fmtPrice } from "@/lib/format";
import { OrderPopup } from "@/components/order-popup/order-popup";

interface CartFooterProps {
  total: number;
  disabled: boolean;
}

export function CartFooter({ total, disabled }: CartFooterProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <div className="border-t px-3.5 py-2.5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span>Totale</span>
          <span className="text-primary">{fmtPrice(total)}</span>
        </div>
        <button
          onClick={() => setShowPopup(true)}
          disabled={disabled}
          className="w-full rounded-[10px] bg-primary px-4 py-2 text-2sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Invia richiesta ordine
        </button>
      </div>

      <OrderPopup open={showPopup} onClose={() => setShowPopup(false)} />
    </>
  );
}
