"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Sparkles } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import {
  extractProductFromText,
  extractProductFromRow,
  extractProductFromStructuredLi,
} from "@/lib/product-extraction";
import { esc } from "@/lib/format";
import { InlineCartButton } from "@/components/chat/inline-cart-button";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { ProductData } from "@/lib/types";

interface AIBannerProps {
  text: string | null;
  isStreaming: boolean;
  products?: ProductData[];
}

export function AIBanner({ text, isStreaming, products }: AIBannerProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  useEffect(() => {
    return () => {
      rootsRef.current.forEach((r) => r.unmount());
      rootsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (isStreaming || !bodyRef.current || !text) return;

    rootsRef.current.forEach((r) => r.unmount());
    rootsRef.current = [];

    const body = bodyRef.current;

    function mountCartButton(
      product: {
        description: string;
        supplier_name: string;
        price: number;
        selling_uom: string;
        id?: string;
        supplier_code?: string;
      },
      container: Element,
      before: Element | null,
    ) {
      const wrapper = document.createElement("span");
      wrapper.style.display = "inline-flex";
      wrapper.style.verticalAlign = "middle";
      wrapper.style.marginLeft = "0.4rem";
      if (before) {
        container.insertBefore(wrapper, before);
      } else {
        container.appendChild(wrapper);
      }
      const root = createRoot(wrapper);
      rootsRef.current.push(root);
      root.render(<InlineCartButton product={product} />);
    }

    // === PRIMARY: Hydrate <cart-chip data-idx="N"> placeholders ===
    let chipCount = 0;
    if (products && products.length > 0) {
      body.querySelectorAll("cart-chip[data-idx]").forEach((chip) => {
        const idx = parseInt(chip.getAttribute("data-idx") ?? "-1", 10);
        if (idx < 0 || idx >= products.length) return;
        const product = products[idx];
        const wrapper = document.createElement("span");
        wrapper.style.display = "inline-flex";
        wrapper.style.verticalAlign = "middle";
        wrapper.style.marginLeft = "0.25rem";
        chip.replaceWith(wrapper);
        const root = createRoot(wrapper);
        rootsRef.current.push(root);
        root.render(<InlineCartButton product={product} />);
        chipCount++;
      });
    }

    // === FALLBACK: DOM-based extraction ===
    if (chipCount === 0) {
      body.querySelectorAll("table tbody tr, table tr").forEach((tr) => {
        if (tr.querySelector("th")) return;
        const product = extractProductFromRow(tr as HTMLTableRowElement);
        if (!product) return;
        const lastTd = tr.querySelector("td:last-child");
        if (lastTd) mountCartButton(product, lastTd, null);
      });

      body.querySelectorAll("li").forEach((li) => {
        if (li.parentElement?.closest("li")) return;
        const tl = (li.textContent ?? "").trim().toLowerCase();
        if (/^(fornitore|prezzo|unit[àa]|marca|codice|formato)/.test(tl)) return;
        const product =
          extractProductFromStructuredLi(li as HTMLLIElement) ??
          extractProductFromText(li.textContent ?? "");
        if (!product) return;
        const subList = li.querySelector(":scope > ul, :scope > ol");
        mountCartButton(product, li, subList);
      });

      body.querySelectorAll("p").forEach((p) => {
        if ((p.textContent ?? "").indexOf("€") === -1) return;
        if (p.closest("table, li")) return;
        const html = p.innerHTML;
        const lines = html.split(/<br\s*\/?>/i);
        if (lines.length <= 1 && html.indexOf("€") !== -1) {
          const product = extractProductFromText(p.textContent ?? "");
          if (product) mountCartButton(product, p, null);
          return;
        }
        let rebuilt = false;
        const newLines: string[] = [];
        for (const line of lines) {
          const tmp = document.createElement("span");
          tmp.innerHTML = line;
          const lt = (tmp.textContent ?? "").trim();
          if (lt.indexOf("€") !== -1) {
            const prod = extractProductFromText(lt);
            if (prod) {
              newLines.push(
                `<span class="product-line" data-d="${esc(prod.description)}" data-s="${esc(prod.supplier_name)}" data-p="${prod.price}" data-u="${esc(prod.selling_uom)}">${line}</span>`,
              );
              rebuilt = true;
              continue;
            }
          }
          newLines.push(line);
        }
        if (rebuilt) {
          p.innerHTML = newLines.join("<br>");
          p.querySelectorAll(".product-line").forEach((span) => {
            const el = span as HTMLElement;
            mountCartButton(
              {
                description: el.dataset.d ?? "",
                supplier_name: el.dataset.s ?? "",
                price: parseFloat(el.dataset.p ?? "0"),
                selling_uom: el.dataset.u ?? "",
              },
              span,
              null,
            );
          });
        }
      });
    }
  }, [text, isStreaming, products]);

  if (!text && !isStreaming) return null;

  return (
    <div className="animate-fade-in-up mb-5 rounded-xl border border-primary/15 bg-primary/[0.03] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
        <div className="min-w-0 flex-1">
          {isStreaming && !text ? (
            <TypingIndicator />
          ) : (
            <div
              ref={bodyRef}
              className="msg-body text-2sm leading-relaxed text-foreground/80"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(text ?? ""),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
