"use client";

import { ChevronRight } from "lucide-react";

export interface TrailItem {
  id: string;
  label: string;
  type: "browse" | "query";
}

interface ConversationTrailProps {
  items: TrailItem[];
  onNavigate: (item: TrailItem) => void;
}

export function ConversationTrail({ items, onNavigate }: ConversationTrailProps) {
  if (items.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
      {items.map((item, i) => (
        <div key={item.id} className="flex shrink-0 items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          )}
          <button
            onClick={() => onNavigate(item)}
            className={`rounded-md px-2 py-0.5 text-2sm transition-colors ${
              i === items.length - 1
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
