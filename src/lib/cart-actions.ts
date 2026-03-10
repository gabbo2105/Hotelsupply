import type { CartAction, ProductData } from "./types";

/** Check if text looks like an order message (to avoid injecting cart buttons) */
function isOrderMsg(t: string): boolean {
  const kw = ["ordine confermato", "riepilogo ordine", "ordine #", "order_number"];
  const low = t.toLowerCase();
  return kw.some((k) => low.includes(k));
}

/**
 * Parse agent response text to extract CART_ACTION and PRODUCTS hidden blocks.
 * Also replaces [[add:N]] tokens with HTML placeholders for cart chip rendering.
 * Returns cleaned text, product suggestions, and cart actions.
 */
export function parseResponse(text: string): {
  text: string;
  products: ProductData[];
  cartActions: CartAction[];
} {
  let cleaned = text;
  const cartActions: CartAction[] = [];
  let products: ProductData[] = [];

  // Extract <!--CART_ACTION[...]-->
  const cartMatch = cleaned.match(/<!--CART_ACTION\[([\s\S]*?)\]-->/);
  if (cartMatch) {
    cleaned = cleaned.replace(cartMatch[0], "").trim();
    try {
      const parsed = JSON.parse(`[${cartMatch[1]}]`.replace(/^\[\[/, "[").replace(/\]\]$/, "]"));
      cartActions.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // ignore malformed
    }
  }

  // Extract <!--PRODUCTS[...]-->
  if (!isOrderMsg(cleaned)) {
    const prodMatch = cleaned.match(/<!--PRODUCTS\[([\s\S]*?)\]-->/);
    if (prodMatch) {
      cleaned = cleaned.replace(prodMatch[0], "").trim();
      try {
        const parsed = JSON.parse(prodMatch[1]);
        products = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // ignore malformed
      }
    }
  }

  // Replace [[add:N]] tokens with data-attribute placeholders
  // These get hydrated into React cart chip components by message-body / ai-banner
  if (products.length > 0) {
    cleaned = cleaned.replace(/\[\[add:(\d+)\]\]/g, (_match, idxStr) => {
      const idx = parseInt(idxStr, 10);
      if (idx < 0 || idx >= products.length) return "";
      return `<cart-chip data-idx="${idx}"></cart-chip>`;
    });
  }

  return { text: cleaned, products, cartActions };
}
