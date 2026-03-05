"use client";

import { useCart } from "@/hooks/use-cart";
import { CartItem } from "./cart-item";
import { CartEmpty } from "./cart-empty";
import { CartFooter } from "./cart-footer";

export function CartSidebar() {
  const { cart, updateQty, removeFromCart, itemCount, total } = useCart();

  return (
    <>
      <div className="flex items-center justify-between border-b px-3.5 py-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          Carrello
          <span
            className={`rounded-full px-1.5 py-0.5 text-2xs font-bold ${
              itemCount > 0
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {itemCount}
          </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {cart.length === 0 ? (
          <CartEmpty />
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQty={(qty) => updateQty(item.id, qty)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))
        )}
      </div>

      <CartFooter total={total} disabled={cart.length === 0} />
    </>
  );
}
