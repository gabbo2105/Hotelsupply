"use client";

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct } from "@/lib/types";

interface HybridResult {
  id: string;
  supplier_name: string;
  supplier_code: string;
  description: string;
  selling_uom: string;
  price: number;
}

export function useHybridSearch() {
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
      const { data, error } = await supabase.functions.invoke("search", {
        body: { query: query.trim(), limit: 50 },
      });

      if (controller.signal.aborted) return;
      if (error) throw error;

      const results: HybridResult[] = data?.results ?? [];

      const mapped: CatalogProduct[] = results.map((r) => ({
        id: r.id,
        supplier_id: "",
        supplier_name: r.supplier_name,
        supplier_code: r.supplier_code,
        description: r.description,
        selling_uom: r.selling_uom,
        price: r.price,
        total_count: results.length,
      }));

      setProducts(mapped);
      setTotalCount(results.length);
    } catch {
      if (!controller.signal.aborted) {
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setProducts([]);
    setTotalCount(0);
  }, []);

  return { products, isLoading, totalCount, search, clear };
}
