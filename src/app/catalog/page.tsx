"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useCart } from "@/hooks/use-cart";
import { useCatalog } from "@/hooks/use-catalog";
import { CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { CategoryBar } from "@/components/catalog/category-bar";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters-panel";

export default function CatalogPage() {
  const { itemCount } = useCart();
  const catalog = useCatalog();

  return (
    <DashboardLayout sidebar={<CartSidebar />} cartCount={itemCount}>
      <div className="flex min-h-0 flex-1 flex-col">
        <CatalogToolbar
          onSearchChange={catalog.setSearch}
          sort={catalog.filters.sort}
          onSortChange={(v) => catalog.setFilter("sort", v)}
          totalCount={catalog.totalCount}
        />
        <CategoryBar
          categories={catalog.categories}
          selected={catalog.filters.category}
          onSelect={(id) => catalog.setFilter("category", id)}
        />
        <div className="flex min-h-0 flex-1">
          <CatalogFiltersPanel
            suppliers={catalog.suppliers}
            filters={catalog.filters}
            onFilterChange={catalog.setFilter}
          />
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <ProductGrid
              products={catalog.products}
              isLoading={catalog.isLoading}
            />
            <CatalogPagination
              currentPage={catalog.filters.page}
              totalPages={catalog.totalPages}
              onPageChange={catalog.setPage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
