"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { CatalogProduct, Category, Supplier, CatalogFilters } from "@/lib/types";

const ADMIN_PAGE_SIZE = 30;

const DEFAULT_FILTERS: CatalogFilters = {
  search: "",
  category: null,
  supplier: null,
  priceMin: null,
  priceMax: null,
  sort: "description",
  page: 1,
};

export function useAdminCatalog() {
  const [filters, setFiltersState] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("suppliers").select("id, name").order("name"),
    ]).then(([catRes, supRes]) => {
      setCategories((catRes.data as Category[]) ?? []);
      setSuppliers((supRes.data as Supplier[]) ?? []);
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const offset = (filters.page - 1) * ADMIN_PAGE_SIZE;
    supabase
      .rpc("search_products_catalog", {
        search_text: filters.search || null,
        category_filter: filters.category,
        supplier_filter: filters.supplier,
        price_min: filters.priceMin,
        price_max: filters.priceMax,
        sort_by: filters.sort,
        page_size: ADMIN_PAGE_SIZE,
        page_offset: offset,
      })
      .then(({ data, error }) => {
        if (!error && data) {
          setProducts(data as CatalogProduct[]);
          setTotalCount((data as CatalogProduct[])[0]?.total_count ?? 0);
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
      debounceRef.current = setTimeout(() => setFilter("search", text), 300);
    },
    [setFilter],
  );

  const updatePrice = useCallback(
    async (productId: string, newPrice: number): Promise<string | null> => {
      setSaving(productId);
      const { error } = await supabase
        .from("products")
        .update({ price: newPrice })
        .eq("id", productId);
      setSaving(null);
      if (!error) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, price: newPrice } : p,
          ),
        );
      }
      return error ? error.message : null;
    },
    [],
  );

  const updateCategory = useCallback(
    async (productId: string, categoryId: string): Promise<string | null> => {
      setSaving(productId);
      const { error } = await supabase
        .from("products")
        .update({ category_id: categoryId })
        .eq("id", productId);
      setSaving(null);
      if (!error) {
        const cat = categories.find((c) => c.id === categoryId);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  category_id: categoryId,
                  category_name: cat?.name ?? "",
                  category_slug: cat?.slug ?? "",
                }
              : p,
          ),
        );
      }
      return error ? error.message : null;
    },
    [categories],
  );

  return {
    products,
    categories,
    suppliers,
    totalCount,
    totalPages: Math.ceil(totalCount / ADMIN_PAGE_SIZE),
    isLoading,
    saving,
    filters,
    setFilter,
    setSearch,
    setPage: (p: number) => setFilter("page", p),
    updatePrice,
    updateCategory,
  };
}
