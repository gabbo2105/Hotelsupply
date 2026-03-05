"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { renderMarkdown } from "@/lib/markdown";
import {
  extractProductFromText,
  extractProductFromRow,
  extractProductFromStructuredLi,
} from "@/lib/product-extraction";
import { esc } from "@/lib/format";
import { InlineCartButton } from "./inline-cart-button";

interface MessageBodyProps {
  text: string;
  isStreaming?: boolean;
}

export function MessageBody({ text, isStreaming }: MessageBodyProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<ReturnType<typeof createRoot>[]>([]);

  // Clean up React roots on unmount
  useEffect(() => {
    return () => {
      rootsRef.current.forEach((r) => r.unmount());
      rootsRef.current = [];
    };
  }, []);

  // Inject cart buttons after render (only when not streaming)
  useEffect(() => {
    if (isStreaming || !bodyRef.current) return;

    // Clean up previous roots
    rootsRef.current.forEach((r) => r.unmount());
    rootsRef.current = [];

    const body = bodyRef.current;

    function mountCartButton(
      product: { description: string; supplier_name: string; price: number; selling_uom: string; id?: string; supplier_code?: string },
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

    // 1. TABLE ROWS
    body.querySelectorAll("table tbody tr, table tr").forEach((tr) => {
      if (tr.querySelector("th")) return;
      const product = extractProductFromRow(tr as HTMLTableRowElement);
      if (!product) return;
      const lastTd = tr.querySelector("td:last-child");
      if (lastTd) mountCartButton(product, lastTd, null);
    });

    // 2. LIST ITEMS (top-level only)
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

    // 3. TEXT LINES with € in <p>
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
  }, [text, isStreaming]);

  return (
    <div
      ref={bodyRef}
      className="msg-body text-[0.92rem] leading-[1.7]"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
