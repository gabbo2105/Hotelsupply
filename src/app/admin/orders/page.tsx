"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminOrders } from "@/hooks/use-admin-orders";
import { AdminOrderDetailDialog } from "@/components/admin/orders/order-detail-dialog";
import { fmtPrice, fmtDate } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_TABS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "Tutti" },
  { value: "pending", label: "In attesa" },
  { value: "confirmed", label: "Confermato" },
  { value: "shipped", label: "Spedito" },
  { value: "delivered", label: "Consegnato" },
  { value: "cancelled", label: "Annullato" },
];

export default function AdminOrdersPage() {
  const {
    orders,
    isLoading,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    updateStatus,
  } = useAdminOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <AdminLayout title="Gestione Ordini">
      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-3 py-1 text-[0.78rem] font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-white"
                : "border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto self-center text-[0.75rem] text-muted-foreground">
          {totalCount} ordini
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Caricamento...
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {[
                  "Ordine",
                  "Hotel",
                  "Contatto",
                  "Totale",
                  "Stato",
                  "Data",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
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
                    <td className="max-w-[180px] truncate px-4 py-2.5">
                      {o.delivery_hotel}
                    </td>
                    <td className="px-4 py-2.5 text-[0.8rem] text-muted-foreground">
                      {o.contact_person}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold">
                      {fmtPrice(o.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className={st.color}>
                        {st.label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[0.8rem] text-muted-foreground">
                      {fmtDate(o.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedOrder(o)}
                      >
                        Dettagli
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nessun ordine
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            &larr; Prec
          </Button>
          <span className="self-center text-[0.8rem] text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Succ &rarr;
          </Button>
        </div>
      )}

      {selectedOrder && (
        <AdminOrderDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateStatus}
        />
      )}
    </AdminLayout>
  );
}
