"use client";

import { Button } from "@/components/ui/button";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  // Show max 5 page buttons around current page
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="text-xs"
      >
        Precedente
      </Button>

      {start > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="h-8 w-8 p-0 text-xs"
          >
            1
          </Button>
          {start > 2 && (
            <span className="px-1 text-xs text-muted-foreground">...</span>
          )}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(p)}
          className="h-8 w-8 p-0 text-xs"
        >
          {p}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-xs text-muted-foreground">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="h-8 w-8 p-0 text-xs"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="text-xs"
      >
        Successivo
      </Button>
    </div>
  );
}
