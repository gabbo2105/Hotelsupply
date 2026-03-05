"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fmtPrice, fmtDate } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

interface Props {
  order: Order;
  onClose: () => void;
  onStatusChange: (
    orderId: string,
    status: OrderStatus,
  ) => Promise<string | null>;
}

export function AdminOrderDetailDialog({
  order,
  onClose,
  onStatusChange,
}: Props) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(
    order.status,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoadingItems(true);
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at");
      setItems((data as OrderItem[]) ?? []);
      setLoadingItems(false);
    })();
  }, [order.id]);

  const handleSaveStatus = async () => {
    if (selectedStatus === order.status) {
      onClose();
      return;
    }
    setSaving(true);
    const err = await onStatusChange(order.id, selectedStatus);
    setSaving(false);
    if (err) {
      setSaveError(err);
      return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[85vh] max-w-[700px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Ordine{" "}
            <span className="text-primary">#{order.order_number}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Consegna
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {order.delivery_hotel}
              <br />
              {order.delivery_address}
              <br />
              {order.contact_person} &middot; {order.contact_phone}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Fatturazione
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {order.billing_company}
              <br />
              P.IVA: {order.billing_vat}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
              Dettagli
            </p>
            <p className="text-muted-foreground">
              Data: {fmtDate(order.created_at)}
              <br />
              Totale:{" "}
              <span className="font-bold text-foreground">
                {fmtPrice(order.total)}
              </span>
            </p>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-2">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
            Prodotti
          </p>
          {loadingItems ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-2sm">
                <thead>
                  <tr>
                    {[
                      "Prodotto",
                      "Cod.",
                      "Fornitore",
                      "Q.tà",
                      "Prezzo",
                      "Totale",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-b bg-muted px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="border-b px-2.5 py-2">
                        {it.description}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {it.selling_uom}
                        </span>
                      </td>
                      <td className="border-b px-2.5 py-2 text-muted-foreground">
                        {it.supplier_code}
                      </td>
                      <td className="border-b px-2.5 py-2">
                        {it.supplier_name}
                      </td>
                      <td className="border-b px-2.5 py-2 text-center">
                        {it.qty}
                      </td>
                      <td className="whitespace-nowrap border-b px-2.5 py-2">
                        {fmtPrice(it.unit_price)}
                      </td>
                      <td className="whitespace-nowrap border-b px-2.5 py-2 font-semibold">
                        {fmtPrice(it.unit_price * it.qty)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={5}
                      className="border-t-2 px-2.5 pt-3 text-right font-bold"
                    >
                      Totale ordine
                    </td>
                    <td className="whitespace-nowrap border-t-2 px-2.5 pt-3 font-bold text-primary">
                      {fmtPrice(order.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status change */}
        <div className="mt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
            Cambia stato
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => {
              const stl = STATUS_LABELS[s];
              return (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`rounded-full border px-3 py-1 text-2sm font-medium transition-colors ${
                    selectedStatus === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {stl?.label ?? s}
                </button>
              );
            })}
          </div>
          {saveError && (
            <p className="mt-2 text-xs text-destructive">{saveError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSaveStatus} disabled={saving}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
