"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Supplier, CatalogFilters } from "@/lib/types";

interface CatalogFiltersPanelProps {
  suppliers: Supplier[];
  filters: CatalogFilters;
  onFilterChange: (key: keyof CatalogFilters, value: unknown) => void;
}

export function CatalogFiltersPanel({
  suppliers,
  filters,
  onFilterChange,
}: CatalogFiltersPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasActiveFilters =
    filters.supplier !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null;

  const content = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Fornitore
        </Label>
        <div className="mt-1.5 space-y-1">
          {suppliers.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                onFilterChange(
                  "supplier",
                  filters.supplier === s.id ? null : s.id,
                )
              }
              className={`block w-full rounded-md px-2 py-1 text-left text-[0.78rem] transition-colors ${
                filters.supplier === s.id
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Prezzo
        </Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="h-8 text-[0.8rem]"
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onFilterChange(
                "priceMin",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
          <Input
            type="number"
            placeholder="Max"
            className="h-8 text-[0.8rem]"
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onFilterChange(
                "priceMax",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            onFilterChange("supplier", null);
            onFilterChange("priceMin", null);
            onFilterChange("priceMax", null);
          }}
        >
          Rimuovi filtri
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: always visible sidebar */}
      <aside className="hidden w-[200px] shrink-0 border-r p-3 md:block">
        {content}
      </aside>

      {/* Mobile: toggle button + overlay */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 left-4 z-30 flex h-10 items-center gap-1.5 rounded-full border bg-card px-4 shadow-lg text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtri
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] text-white">
              !
            </span>
          )}
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/35"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t bg-card p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">Filtri</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              {content}
            </div>
          </>
        )}
      </div>
    </>
  );
}
