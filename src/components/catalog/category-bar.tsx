"use client";

import type { Category } from "@/lib/types";

interface CategoryBarProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryBar({
  categories,
  selected,
  onSelect,
}: CategoryBarProps) {
  if (!categories.length) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-b scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-2sm font-medium transition-colors ${
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        Tutti
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(selected === cat.id ? null : cat.id)}
          className={`shrink-0 rounded-full px-3 py-1 text-2sm font-medium transition-colors ${
            selected === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
