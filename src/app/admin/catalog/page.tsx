"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminCatalog } from "@/hooks/use-admin-catalog";
import { fmtPrice } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { CatalogProduct } from "@/lib/types";

function InlinePriceCell({
  product,
  isSaving,
  onSave,
}: {
  product: CatalogProduct;
  isSaving: boolean;
  onSave: (id: string, price: number) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.price.toString());
  const [error, setError] = useState<string | null>(null);

  const handleBlur = async () => {
    setEditing(false);
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      setError("Prezzo non valido");
      return;
    }
    if (parsed === product.price) return;
    const err = await onSave(product.id, parsed);
    if (err) setError(err);
    else setError(null);
  };

  if (editing) {
    return (
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        autoFocus
        className="h-7 w-24 text-2sm"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setEditing(true);
        setValue(product.price.toString());
        setError(null);
      }}
      className="rounded px-1 py-0.5 text-2sm font-semibold text-primary transition-colors hover:bg-primary/10"
      title="Clicca per modificare"
    >
      {isSaving ? "..." : fmtPrice(product.price)}
      {error && (
        <span className="ml-1 text-2xs text-destructive">{error}</span>
      )}
    </button>
  );
}

export default function AdminCatalogPage() {
  const {
    products,
    suppliers,
    totalCount,
    totalPages,
    isLoading,
    saving,
    filters,
    setFilter,
    setSearch,
    setPage,
    updatePrice,
  } = useAdminCatalog();

  return (
    <AdminLayout title="Gestione Catalogo">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Cerca prodotti..."
          className="h-9 w-[260px]"
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filters.supplier ?? ""}
          onChange={(e) => setFilter("supplier", e.target.value || null)}
          className="h-9 rounded-md border bg-background px-3 text-2sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tutti i fornitori</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="ml-auto text-2sm text-muted-foreground">
          {totalCount.toLocaleString("it-IT")} prodotti
        </span>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {[
                  "Descrizione",
                  "Codice",
                  "Fornitore",
                  "UdM",
                  "Prezzo",
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
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="max-w-[280px] px-4 py-2.5">
                    <span className="line-clamp-2 text-2sm leading-snug">
                      {p.description}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {p.supplier_code}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-xs">
                      {p.supplier_name}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-2sm text-muted-foreground">
                    {p.selling_uom}
                  </td>
                  <td className="px-4 py-2.5">
                    <InlinePriceCell
                      product={p}
                      isSaving={saving === p.id}
                      onSave={updatePrice}
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nessun prodotto trovato
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
            disabled={filters.page === 1}
            onClick={() => setPage(filters.page - 1)}
          >
            &larr; Prec
          </Button>
          <span className="self-center text-2sm text-muted-foreground">
            {filters.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === totalPages}
            onClick={() => setPage(filters.page + 1)}
          >
            Succ &rarr;
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
