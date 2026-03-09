"use client";

import { useCallback, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useCart } from "@/hooks/use-cart";
import { useProductSearch } from "@/hooks/use-product-search";
import { useAuth } from "@/hooks/use-auth";
import { CuratedGrid } from "@/components/fluid/curated-grid";
import { WelcomeScreen } from "@/components/fluid/welcome-screen";
import { FluidInput } from "@/components/fluid/fluid-input";
import { ArrowLeft } from "lucide-react";

type ViewState =
  | { mode: "welcome" }
  | { mode: "search"; query: string };

export default function SearchPage() {
  const { itemCount } = useCart();
  const { customer } = useAuth();
  const hybrid = useProductSearch();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<ViewState>({ mode: "welcome" });

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setView({ mode: "search", query: text.trim() });
      hybrid.search(text.trim());
      scrollToTop();
    },
    [hybrid, scrollToTop],
  );

  const handleBack = useCallback(() => {
    setView({ mode: "welcome" });
    hybrid.clear();
  }, [hybrid]);

  const activeProducts = hybrid.products;
  const activeLoading = hybrid.isLoading;
  const activeCount = hybrid.totalCount;

  return (
    <DashboardLayout
      sidebar={<CartSidebar />}
      cartCount={itemCount}
      onNewChat={handleBack}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        {view.mode === "welcome" ? (
          <>
            <div className="flex flex-1 overflow-y-auto pb-24">
              <WelcomeScreen
                customerName={customer?.contact_person}
              />
            </div>
            <FluidInput
              onSend={handleSend}
              disabled={false}
              mode="welcome"
            />
          </>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto pb-24"
            >
              <div className="mx-auto max-w-[960px] px-4 pt-4">
                {/* Back button + context */}
                <div className="mb-5 flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                    aria-label="Torna alla home"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-foreground">
                      &ldquo;{view.query}&rdquo;
                    </h2>
                    {!activeLoading && (
                      <p className="text-2sm text-muted-foreground">
                        {activeCount.toLocaleString("it-IT")} prodotti trovati
                      </p>
                    )}
                  </div>
                </div>

                {/* Products */}
                <CuratedGrid
                  products={activeProducts}
                  isLoading={activeLoading}
                />

                {/* Zero-results */}
                {!activeLoading && activeCount === 0 && (
                  <div className="flex flex-col items-center py-10">
                    <p className="text-sm text-muted-foreground">
                      Nessun prodotto trovato per questa ricerca.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <FluidInput
              onSend={handleSend}
              disabled={false}
              mode="search"
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
