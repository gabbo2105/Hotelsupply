"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

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
  const { customer, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isCatalog = pathname.startsWith("/catalog");
  const isChat = pathname === "/chat" || pathname === "/chat/";
  const isOrders = pathname.startsWith("/orders");

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center">
        <div className="text-[0.95rem] font-bold">
          Hotel Supply <span className="text-primary">Pro</span>
        </div>
        {customer?.hotel_name && (
          <span className="ml-2 text-[0.78rem] text-muted-foreground">
            {customer.hotel_name}
          </span>
        )}
        <nav className="ml-3 flex gap-0.5">
          <button
            onClick={() => router.push("/catalog")}
            className={`rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
              isCatalog
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Catalogo
          </button>
          <button
            onClick={() => router.push("/chat")}
            className={`rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
              isChat
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => router.push("/orders")}
            className={`rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
              isOrders
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Ordini
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        {customer?.contact_person && (
          <span className="mr-1 text-[0.8rem] text-muted-foreground">
            {customer.contact_person}
          </span>
        )}

        {/* Mobile cart toggle */}
        <button
          onClick={onCartToggle}
          className="cart:hidden relative flex items-center rounded-lg border px-2 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <ShoppingCart className="h-[18px] w-[18px]" />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[0.65rem] font-bold text-white">
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
