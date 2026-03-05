export function fmtPrice(n: number): string {
  return "€" + n.toFixed(2).replace(".", ",");
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function esc(t: string): string {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}
