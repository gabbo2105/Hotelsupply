"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import { SEND_ORDER_EMAIL_URL } from "@/lib/constants";
import { fmtPrice } from "@/lib/format";
import { esc } from "@/lib/format";

interface OrderPopupProps {
  open: boolean;
  onClose: () => void;
}

export function OrderPopup({ open, onClose }: OrderPopupProps) {
  const { customer } = useAuth();
  const { cart, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!cart.length || !customer) return;
    setLoading(true);

    try {
      // Server-side order creation with validated prices
      const p_items = cart
        .filter((c) => c.id && /^[0-9a-f-]{36}$/.test(c.id))
        .map((c) => ({ product_id: c.id, qty: c.qty }));

      if (!p_items.length) throw new Error("Nessun prodotto valido nel carrello");

      const { data: orderData, error } = await supabase.rpc("create_order", {
        p_items,
      });
      if (error) throw error;

      const { order_number, order_id, total: orderTotal } = orderData;

      // Send confirmation email (fire-and-forget)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      fetch(SEND_ORDER_EMAIL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id }),
      }).catch(console.error);

      clearCart();
      onClose();

      toast.success(
        `Ordine #${order_number} confermato! Totale: ${(+orderTotal).toFixed(2)} EUR`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Errore nell'invio dell'ordine: ${msg}`);
    }

    setLoading(false);
  }

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-[580px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riepilogo ordine</DialogTitle>
        </DialogHeader>

        {/* Products table */}
        <div className="space-y-4">
          <section>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              Prodotti
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-2sm">
                <thead>
                  <tr>
                    <th className="border-b px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Prodotto
                    </th>
                    <th className="border-b px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Forn.
                    </th>
                    <th className="border-b px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Q.tà
                    </th>
                    <th className="border-b px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Prezzo
                    </th>
                    <th className="border-b px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Totale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c) => (
                    <tr key={c.id}>
                      <td className="border-b px-2 py-1.5">
                        {c.description}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {c.selling_uom}
                        </span>
                      </td>
                      <td className="border-b px-2 py-1.5 text-2sm">
                        {c.supplier_name}
                      </td>
                      <td className="border-b px-2 py-1.5 text-center">
                        {c.qty}
                      </td>
                      <td className="border-b px-2 py-1.5">
                        {fmtPrice(c.price)}
                      </td>
                      <td className="border-b px-2 py-1.5 font-semibold">
                        {fmtPrice(c.price * c.qty)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t-2 px-2 pt-2 text-right font-bold"
                    >
                      Totale ordine
                    </td>
                    <td className="border-t-2 px-2 pt-2 text-base font-bold text-primary">
                      {fmtPrice(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Consegna
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {customer.hotel_name || "—"}
              <br />
              {customer.hotel_address || "—"}
              <br />
              Ref: {customer.contact_person || "—"} · {customer.phone || "—"}
            </p>
          </section>

          {/* Billing */}
          <section>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Fatturazione
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {customer.company_name || "—"}
              <br />
              P.IVA: {customer.vat_number || "—"}
            </p>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Modifica ordine
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Invio in corso..." : "Conferma ordine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
