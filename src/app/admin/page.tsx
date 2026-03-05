"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { supabase } from "@/lib/supabase";
import { fmtPrice, fmtDate } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { AdminKPIs, Order } from "@/lib/types";

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[1.8rem] font-bold text-foreground">{value}</p>
      {sub && (
        <p className="text-[0.72rem] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [kpiRes, ordersRes] = await Promise.all([
        supabase.rpc("admin_dashboard_kpis"),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setKpis(kpiRes.data as AdminKPIs);
      setRecentOrders((ordersRes.data as Order[]) ?? []);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-sm text-muted-foreground">Caricamento...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Ordini totali"
          value={kpis?.total_orders.toString() ?? "0"}
        />
        <KpiCard
          label="Fatturato"
          value={fmtPrice(kpis?.total_revenue ?? 0)}
        />
        <KpiCard
          label="Clienti"
          value={kpis?.total_customers.toString() ?? "0"}
        />
        <KpiCard
          label="Prodotti"
          value={kpis?.total_products.toLocaleString("it-IT") ?? "0"}
          sub={`${kpis?.pending_orders ?? 0} ordini in attesa`}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-[0.85rem] font-bold uppercase tracking-wider text-muted-foreground">
          Ordini recenti
        </h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["Ordine", "Hotel", "Totale", "Stato", "Data"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const st = STATUS_LABELS[o.status] ?? {
                  label: o.status,
                  color: "bg-muted text-muted-foreground",
                };
                return (
                  <tr
                    key={o.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-semibold text-primary">
                      #{o.order_number}
                    </td>
                    <td className="px-4 py-2.5 text-foreground/80">
                      {o.delivery_hotel}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {fmtPrice(o.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className={st.color}>
                        {st.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[0.8rem] text-muted-foreground">
                      {fmtDate(o.created_at)}
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nessun ordine
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
