import type { ProductData } from "./types";

const SUPPLIER_RE =
  /\b(?:[A-Z][A-Za-z&'. ]*(?:S\.?P\.?A\.?|S\.?R\.?L\.?|S\.?A\.?S\.?|S\.?N\.?C\.?))\b/;
const KNOWN_SUPPLIERS = ["BINDI", "MARR", "DORECA", "DAC", "FORNO D'ASOLO", "CENTROFARC"];
const PRICE_RE = /€\s*(\d+[.,]\d{2})/;

function findSupplier(text: string): string {
  // Try regex first (S.P.A., S.R.L., etc.)
  const m = text.match(SUPPLIER_RE);
  if (m) return m[0].trim();
  // Try known supplier names
  const upper = text.toUpperCase();
  for (const s of KNOWN_SUPPLIERS) {
    if (upper.includes(s)) return s;
  }
  // Try parenthesized text
  const paren = text.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim();
  return "";
}

/**
 * Extract product data from a text line (bullet point, paragraph).
 * Port of extractProductFromText() from index.html:497-517.
 */
export function extractProductFromText(fullText: string): ProductData | null {
  const priceMatch = fullText.match(PRICE_RE);
  if (!priceMatch) return null;

  const price = parseFloat(priceMatch[1].replace(",", "."));
  if (isNaN(price) || price <= 0) return null;

  const supplier = findSupplier(fullText);
  if (!supplier) return null;

  // Description: text before the supplier or price, cleaned up
  let desc = fullText;
  const supplierIdx = desc.indexOf(supplier);
  if (supplierIdx > 0) desc = desc.substring(0, supplierIdx);
  const priceIdx = desc.indexOf("€");
  if (priceIdx > 0) desc = desc.substring(0, priceIdx);
  desc = desc.replace(/^[\s•\-\d.)+]+/, "").replace(/[–—\-(]+\s*$/, "").trim();
  if (desc.length < 3) return null;

  // UoM: text after price
  let uom = "";
  const afterPrice = fullText.substring(fullText.indexOf(priceMatch[0]) + priceMatch[0].length);
  if (afterPrice.trim()) {
    uom = afterPrice.replace(/^[\s,–—-]+/, "").trim();
  }

  return { description: desc, supplier_name: supplier, price, selling_uom: uom || "pz" };
}

/**
 * Extract product data from an HTML table row.
 * Port of extractProductFromRow() from index.html:519-535.
 */
export function extractProductFromRow(tr: HTMLTableRowElement): ProductData | null {
  const cells = Array.from(tr.querySelectorAll("td"));
  if (cells.length < 3) return null;

  let desc = "";
  let supplier = "";
  let price = 0;
  let uom = "";

  for (const cell of cells) {
    const text = cell.textContent?.trim() ?? "";
    const priceMatch = text.match(PRICE_RE);

    if (priceMatch && !price) {
      price = parseFloat(priceMatch[1].replace(",", "."));
    } else if (!desc && text.length > 5 && /[A-Z]/.test(text)) {
      // Heuristic: description has many uppercase chars
      const upperCount = (text.match(/[A-Z]/g) || []).length;
      if (upperCount >= 3) desc = text;
    }

    if (!supplier) {
      const s = findSupplier(text);
      if (s) supplier = s;
    }

    if (!uom && /\b(ml|cl|lt?|kg|gr?|pz|ct|conf|bott|latt)\b/i.test(text)) {
      uom = text;
    }
  }

  if (!desc || !price || !supplier) return null;
  return { description: desc, supplier_name: supplier, price, selling_uom: uom || "pz" };
}

/**
 * Extract product data from a structured list item with sub-items.
 * Port of extractProductFromStructuredLi() from index.html:537-557.
 */
export function extractProductFromStructuredLi(li: HTMLLIElement): ProductData | null {
  const subItems = li.querySelectorAll("ul li, ol li");
  if (subItems.length < 2) return null;

  const desc = li.childNodes[0]?.textContent?.replace(/^[\s\d.)+]+/, "").trim() ?? "";
  let supplier = "";
  let price = 0;
  let uom = "";

  subItems.forEach((sub) => {
    const text = sub.textContent?.trim() ?? "";
    const lower = text.toLowerCase();
    if (lower.startsWith("fornitore:") || lower.startsWith("fornitore :")) {
      supplier = text.replace(/^fornitore\s*:\s*/i, "").trim();
    } else if (lower.startsWith("prezzo:") || lower.startsWith("prezzo :")) {
      const m = text.match(PRICE_RE);
      if (m) price = parseFloat(m[1].replace(",", "."));
    } else if (lower.startsWith("unità:") || lower.startsWith("unita:") || lower.startsWith("formato:")) {
      uom = text.replace(/^(?:unità|unita|formato)\s*:\s*/i, "").trim();
    }
  });

  if (!desc || !price || !supplier) return null;
  return { description: desc, supplier_name: supplier, price, selling_uom: uom || "pz" };
}
