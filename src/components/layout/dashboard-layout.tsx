"use client";

import { useState, useCallback } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardHeader } from "./dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  cartCount?: number;
  onNewChat?: () => void;
}

export function DashboardLayout({
  children,
  sidebar,
  cartCount = 0,
  onNewChat,
}: DashboardLayoutProps) {
  const [cartOpen, setCartOpen] = useState(false);

  const handleCartToggle = useCallback(() => {
    setCartOpen((prev) => !prev);
  }, []);

  const handleCloseCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col">
        <DashboardHeader
          cartCount={cartCount}
          onCartToggle={handleCartToggle}
          onNewChat={onNewChat ?? (() => {})}
        />
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>

          {/* Desktop sidebar (>=900px) */}
          {sidebar && (
            <aside className="hidden cart:flex w-[300px] shrink-0 flex-col border-l bg-sidebar">
              {sidebar}
            </aside>
          )}

          {/* Mobile overlay */}
          {sidebar && cartOpen && (
            <>
              <div
                className="cart:hidden fixed inset-0 z-40 bg-black/35"
                onClick={handleCloseCart}
              />
              <aside className="cart:hidden fixed bottom-0 right-0 top-[52px] z-50 flex w-[300px] max-w-[85vw] flex-col border-l bg-sidebar shadow-xl">
                {sidebar}
              </aside>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
