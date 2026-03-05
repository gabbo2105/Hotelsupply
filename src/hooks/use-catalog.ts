"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CATALOG_PAGE_SIZE } from "@/lib/constants";
import type {
  CatalogProduct,
  Category,
  Supplier,
  CatalogFilters,
} from "@/lib/types";

const DEFAULT_FILTERS: CatalogFilters = {
  search: "",
  category: null,
  supplier: null,
  priceMin: null,
  priceMax: null,
  sort: "description",
  page: 1,
};

export function useCatalog() {
  const [filters, setFiltersState] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load categories + suppliers once
  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("suppliers").select("id, name").order("name"),
    ]).then(([catRes, supRes]) => {
      setCategories((catRes.data as Category[]) ?? []);
      setSuppliers((supRes.data as Supplier[]) ?? []);
    });
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    setIsLoading(true);
    const offset = (filters.page - 1) * CATALOG_PAGE_SIZE;

    supabase
      .rpc("search_products_catalog", {
        search_text: filters.search || null,
        category_filter: filters.category,
        supplier_filter: filters.supplier,
        price_min: filters.priceMin,
        price_max: filters.priceMax,
        sort_by: filters.sort,
        page_size: CATALOG_PAGE_SIZE,
        page_offset: offset,
      })
      .then(({ data, error }) => {
        if (!error && data) {
          setProducts(data as CatalogProduct[]);
          setTotalCount(
            (data as CatalogProduct[])[0]?.total_count ?? 0,
          );
        } else {
          setProducts([]);
          setTotalCount(0);
        }
        setIsLoading(false);
      });
  }, [filters]);

  const setFilter = useCallback(
    (key: keyof CatalogFilters, value: unknown) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
        ...(key !== "page" ? { page: 1 } : {}),
      }));
    },
    [],
  );

  const setSearch = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilter("search", text);
      }, 300);
    },
    [setFilter],
  );

  return {
    products,
    categories,
    suppliers,
    totalCount,
    totalPages: Math.ceil(totalCount / CATALOG_PAGE_SIZE),
    isLoading,
    filters,
    setFilter,
    setSearch,
    setPage: (p: number) => setFilter("page", p),
  };
}
