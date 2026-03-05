"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SORT_OPTIONS } from "@/lib/constants";

interface CatalogToolbarProps {
  onSearchChange: (text: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  totalCount: number;
}

export function CatalogToolbar({
  onSearchChange,
  sort,
  onSortChange,
  totalCount,
}: CatalogToolbarProps) {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex items-center gap-3 border-b px-4 py-2.5">
      <div className="relative flex-1 max-w-[400px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cerca prodotti..."
          className="pl-9 h-9"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onSearchChange(e.target.value);
          }}
        />
      </div>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-[0.82rem] text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <span className="ml-auto text-[0.78rem] text-muted-foreground whitespace-nowrap">
        {totalCount.toLocaleString("it-IT")} prodotti
      </span>
    </div>
  );
}
