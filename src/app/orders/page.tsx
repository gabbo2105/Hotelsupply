"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";
import { fmtPrice, fmtDate } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import type { Order, OrderItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function OrdersList() {
  const { customer } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (err) {
        setError("Errore nel caricamento degli ordini.");
        return;
      }
      setOrders(data ?? []);
    })();
  }, [customer]);

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Caricamento...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-muted-foreground">{error}</div>
    );
  if (!orders.length)
    return (
      <div className="p-12 text-center text-muted-foreground">
        Non hai ancora effettuato ordini.
        <br />
        Cerca prodotti nella chat e invia il tuo primo ordine!
      </div>
    );

  return (
    <div className="space-y-2">
      {orders.map((o) => {
        const st = STATUS_LABELS[o.status] ?? {
          label: o.status,
          color: "bg-muted text-muted-foreground",
        };
        return (
          <div
            key={o.id}
            onClick={() => router.push(`/orders?id=${o.id}`)}
            className="flex cursor-pointer items-center justify-between rounded-xl border bg-card p-3.5 transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="min-w-0">
              <div className="text-[0.9rem] font-bold">
                Ordine <span className="text-primary">#{o.order_number}</span>
              </div>
              <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
                {fmtDate(o.created_at)}
              </div>
              <div className="mt-0.5 text-[0.75rem] text-foreground/70">
                {o.delivery_hotel}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[0.95rem] font-bold text-primary">
                {fmtPrice(o.total)}
              </div>
              <Badge variant="secondary" className={`mt-1 ${st.color}`}>
                {st.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [or, ir] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at"),
      ]);
      setLoading(false);
      if (or.error || ir.error) return;
      setOrder(or.data);
      setItems(ir.data ?? []);
    })();
  }, [orderId]);

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Caricamento dettaglio...
      </div>
    );
  if (!order) return null;

  const st = STATUS_LABELS[order.status] ?? {
    label: order.status,
    color: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/orders")}
        >
          ← Indietro
        </Button>
        <h2 className="text-lg font-bold">
          Ordine <span className="text-primary">#{order.order_number}</span>
        </h2>
      </div>

      <section>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
          Stato
        </h4>
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary" className={st.color}>
            {st.label}
          </Badge>{" "}
          · {fmtDate(order.created_at)}
        </div>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
          Consegna
        </h4>
        <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
          {order.delivery_hotel || "-"}
          <br />
          {order.delivery_address || "-"}
          <br />
          Ref: {order.contact_person || "-"} · {order.contact_phone || "-"}
        </p>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
          Fatturazione
        </h4>
        <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
          {order.billing_company || "-"}
          <br />
          P.IVA: {order.billing_vat || "-"}
        </p>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
          Prodotti
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr>
                {["Prodotto", "Cod.", "Fornitore", "Q.tà", "Prezzo", "Totale"].map(
                  (h) => (
                    <th
                      key={h}
                      className="border-b bg-muted px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="border-b px-2.5 py-2">
                    {it.description}
                    <br />
                    <span className="text-[0.72rem] text-muted-foreground">
                      {it.selling_uom}
                    </span>
                  </td>
                  <td className="border-b px-2.5 py-2 text-[0.75rem] text-muted-foreground">
                    {it.supplier_code}
                  </td>
                  <td className="border-b px-2.5 py-2">{it.supplier_name}</td>
                  <td className="border-b px-2.5 py-2 text-center">
                    {it.qty}
                  </td>
                  <td className="border-b px-2.5 py-2">
                    {fmtPrice(it.unit_price)}
                  </td>
                  <td className="border-b px-2.5 py-2 font-semibold">
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
                <td className="border-t-2 px-2.5 pt-3 font-bold text-primary">
                  {fmtPrice(order.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {order.notes && (
        <section>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
            Note
          </h4>
          <p className="text-[0.85rem] text-muted-foreground">{order.notes}</p>
        </section>
      )}
    </div>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-[800px]">
        {!orderId && (
          <h1 className="mb-4 text-lg font-bold">I miei ordini</h1>
        )}
        {orderId ? <OrderDetail orderId={orderId} /> : <OrdersList />}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { itemCount } = useCart();

  return (
    <DashboardLayout cartCount={itemCount}>
      <Suspense>
        <OrdersContent />
      </Suspense>
    </DashboardLayout>
  );
}
