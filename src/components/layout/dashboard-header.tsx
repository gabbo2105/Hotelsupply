"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  cartCount: number;
  onCartToggle: () => void;
  onNewChat: () => void;
}

export function DashboardHeader({
  cartCount,
  onCartToggle,
  onNewChat,
}: DashboardHeaderProps) {
  const { customer, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const isHome =
    pathname === "/" ||
    pathname === "/Hotelsupply" ||
    pathname === "/Hotelsupply/";
  const isChat = pathname.startsWith("/chat");
  const isOrders = pathname.startsWith("/orders");
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center">
        <div className="text-base font-bold">
          Hotel Supply <span className="text-primary">Pro</span>
        </div>
        {customer?.hotel_name && (
          <span className="ml-2 text-2sm text-muted-foreground">
            {customer.hotel_name}
          </span>
        )}
        <nav className="ml-3 flex gap-0.5">
          <Link
            href="/"
            aria-current={isHome ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-2sm font-semibold transition-all duration-200 ${
              isHome
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Esplora
          </Link>
          <Link
            href="/chat"
            aria-current={isChat ? "page" : undefined}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-2sm font-semibold transition-all duration-200 ${
              isChat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            AI
          </Link>
          <Link
            href="/orders"
            aria-current={isOrders ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-2sm font-semibold transition-all duration-200 ${
              isOrders
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Ordini
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              aria-current={isAdminRoute ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-2sm font-semibold transition-all duration-200 ${
                isAdminRoute
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        {customer?.contact_person && (
          <span className="mr-1 text-2sm text-muted-foreground">
            {customer.contact_person}
          </span>
        )}

        {/* Mobile cart toggle */}
        <button
          onClick={onCartToggle}
          aria-label="Apri carrello"
          className="cart:hidden relative flex items-center rounded-lg border px-2 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-destructive text-2xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

        <Button variant="outline" size="sm" onClick={onNewChat}>
          + Nuova
        </Button>
        <Button variant="outline" size="sm" onClick={signOut}>
          Esci
        </Button>
      </div>
    </header>
  );
}
