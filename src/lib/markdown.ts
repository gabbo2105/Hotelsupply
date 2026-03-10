import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

// Allow <cart-chip> through DOMPurify (used for product cart buttons)
DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "cart-chip") {
    data.allowedTags["cart-chip"] = true;
  }
});

export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text) as string, {
    ADD_TAGS: ["cart-chip"],
    ADD_ATTR: ["data-idx"],
  });
}
