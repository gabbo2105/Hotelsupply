"use client";

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct } from "@/lib/types";

export function useProductSearch() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setTotalCount(0);
      return;
    }

    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("search_products_v2", {
        search_text: query.trim(),
        sort_by: "relevance",
        page_size: 50,
        page_offset: 0,
      });

      if (controller.signal.aborted) return;
      if (error) throw error;

      const results = (data as CatalogProduct[]) ?? [];
      setProducts(results);
      setTotalCount(results[0]?.total_count ?? 0);
    } catch {
      if (!controller.signal.aborted) {
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setProducts([]);
    setTotalCount(0);
  }, []);

  return { products, isLoading, totalCount, search, clear };
}
