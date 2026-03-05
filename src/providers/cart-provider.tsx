"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { CartAction, CartItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export interface CartContextValue {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  applyCartActions: (actions: CartAction[]) => void;
  clearCart: () => void;
  flushSync: () => Promise<void>;
  itemCount: number;
  total: number;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer, session } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "",
  );

  // Expose sessionId for chat hook
  const getSessionId = useCallback(() => sessionIdRef.current, []);

  // Reset session ID on new chat
  const resetSessionId = useCallback(() => {
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  // Debounced sync to Supabase
  const syncCart = useCallback(
    (items: CartItem[]) => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(async () => {
        if (!customer?.id) return;
        try {
          await supabase.from("cart_sessions").upsert(
            {
              customer_id: customer.id,
              session_id: sessionIdRef.current,
              items,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "customer_id,session_id" },
          );
        } catch (e) {
          console.error("syncCart:", e);
        }
      }, 300);
    },
    [customer?.id],
  );

  // Flush immediately (before sending chat message)
  const flushSync = useCallback(async () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (!customer?.id) return;
    try {
      await supabase.from("cart_sessions").upsert(
        {
          customer_id: customer.id,
          session_id: sessionIdRef.current,
          items: cartRef.current,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "customer_id,session_id" },
      );
    } catch (e) {
      console.error("flushSync:", e);
    }
  }, [customer?.id]);

  // Load cart on mount
  useEffect(() => {
    if (!customer?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("cart_sessions")
          .select("items")
          .eq("customer_id", customer.id)
          .eq("session_id", sessionIdRef.current)
          .maybeSingle();
        if (data?.items && Array.isArray(data.items) && data.items.length) {
          setCart(data.items);
        }
      } catch (e) {
        console.error("loadCart:", e);
      }
    })();
  }, [customer?.id]);

  const addToCart = useCallback(
    (item: CartItem) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        let next: CartItem[];
        if (existing) {
          next = prev.map((c) =>
            c.id === item.id ? { ...c, qty: c.qty + item.qty } : c,
          );
        } else {
          next = [...prev, item];
        }
        syncCart(next);
        return next;
      });
    },
    [syncCart],
  );

  const removeFromCart = useCallback(
    (id: string) => {
      setCart((prev) => {
        const next = prev.filter((c) => c.id !== id);
        syncCart(next);
        return next;
      });
    },
    [syncCart],
  );

  const updateQty = useCallback(
    (id: string, qty: number) => {
      if (qty < 1) {
        removeFromCart(id);
        return;
      }
      setCart((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, qty } : c));
        syncCart(next);
        return next;
      });
    },
    [syncCart, removeFromCart],
  );

  const applyCartActions = useCallback(
    (actions: CartAction[]) => {
      setCart((prev) => {
        let next = [...prev];
        for (const a of actions) {
          if (a.action === "add" && a.id) {
            const ex = next.find((c) => c.id === a.id);
            if (ex) {
              next = next.map((c) =>
                c.id === a.id ? { ...c, qty: c.qty + (a.qty ?? 1) } : c,
              );
            } else {
              next.push({
                id: a.id,
                supplier_code: a.supplier_code ?? "",
                description: a.description ?? "Prodotto",
                supplier_name: a.supplier_name ?? "",
                price: a.price ?? 0,
                selling_uom: a.selling_uom ?? "",
                qty: a.qty ?? 1,
              });
            }
          } else if (a.action === "remove" && a.id) {
            next = next.filter((c) => c.id !== a.id);
          } else if (a.action === "update_qty" && a.id) {
            next = next.map((c) =>
              c.id === a.id ? { ...c, qty: Math.max(1, a.qty ?? 1) } : c,
            );
          } else if (a.action === "clear") {
            next = [];
          }
        }
        syncCart(next);
        return next;
      });
    },
    [syncCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    syncCart([]);
  }, [syncCart]);

  const itemCount = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        applyCartActions,
        clearCart,
        flushSync,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
