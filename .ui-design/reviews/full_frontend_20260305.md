# Design Review: Intero Frontend

**Review ID:** full_frontend_20260305
**Reviewed:** 2026-03-05
**Target:** src/ (tutte le pagine e componenti)
**Focus:** Visual design, Usability, Code quality, Performance
**Platform:** Responsive (desktop + mobile)

## Summary

L'app ha una base solida con token semantici ben strutturati (Tailwind v4 + shadcn new-york), un brand color coerente (#d4802a) e componenti ben separati via hook pattern. I problemi principali sono: **accessibilita carente** (navigazione non semantica, mancano aria-label, no focus trap), **scala tipografica frammentata** (16+ valori arbitrari in rem), **admin layout non responsive**, e **colori hardcoded** che bypassano il design token system.

**Issues Found:** 28

- Critical: 4
- Major: 9
- Minor: 10
- Suggestions: 5

---

## Critical Issues

### C1: Navigazione usa `<button>` invece di `<Link>`/`<a>`

**Severity:** Critical
**Location:** `src/components/layout/dashboard-header.tsx`, `src/components/layout/admin-layout.tsx`
**Category:** Usability / Accessibility

**Problem:**
Tutti i link di navigazione (Catalogo, Chat, Ordini, Admin, sidebar admin) sono implementati come `<button onClick={() => router.push(...)}>` invece di `<Link>` o `<a href>`.

**Impact:**
- No right-click "Apri in nuova scheda"
- Screen reader non annuncia come link
- No `href` per crawlability
- No prefetch di Next.js

**Recommendation:**

```tsx
// Prima
<button onClick={() => router.push("/catalog")}>Catalogo</button>

// Dopo
import Link from "next/link";
<Link href="/catalog" className={...}>Catalogo</Link>
```

---

### C2: Righe ordini clickabili sono `<div>`, non elementi interattivi

**Severity:** Critical
**Location:** `src/app/orders/page.tsx`
**Category:** Accessibility

**Problem:**
Le card ordine sono `<div onClick={...}>` — non navigabili da tastiera, nessun `role`, nessun `tabIndex`.

**Impact:**
Utenti keyboard-only o screen reader non possono accedere al dettaglio ordine.

**Recommendation:**

```tsx
// Prima
<div onClick={() => setSelected(o)} className="cursor-pointer ...">

// Dopo
<button onClick={() => setSelected(o)} className="w-full text-left ...">
```

---

### C3: Chat — nessun `aria-live` per nuovi messaggi

**Severity:** Critical
**Location:** `src/components/chat/message-list.tsx`, `src/components/chat/chat-input.tsx`
**Category:** Accessibility

**Problem:**
- La lista messaggi non ha `aria-live="polite"` — screen reader non annunciano nuovi messaggi
- L'input chat non ha `<label>` ne `aria-label`
- Il bottone invio non ha `aria-label`
- Il typing indicator non ha `role="status"`

**Recommendation:**

```tsx
// MessageList wrapper
<div aria-live="polite" aria-relevant="additions">

// ChatInput
<input aria-label="Scrivi un messaggio..." />
<button aria-label="Invia messaggio">
```

---

### C4: Form registrazione — label non associate agli input

**Severity:** Critical
**Location:** `src/components/auth/register-form.tsx`
**Category:** Accessibility

**Problem:**
I campi del form usano `<Label>` e `<Input>` senza `id`/`htmlFor`, rompendo l'associazione label-input per screen reader. Mancano anche `required` e `autocomplete`.

**Recommendation:**
Aggiungere `id` a ogni `<Input>` e `htmlFor` corrispondente a ogni `<Label>`. Aggiungere `autocomplete` (es. `email`, `new-password`, `organization`).

---

## Major Issues

### M1: Scala tipografica frammentata — 16+ valori arbitrari

**Severity:** Major
**Location:** Tutto il codebase
**Category:** Visual Design / Maintainability

**Problem:**
Il codebase usa oltre 16 valori arbitrari di font-size: `text-[0.65rem]`, `text-[0.68rem]`, `text-[0.7rem]`, `text-[0.72rem]`, `text-[0.75rem]`, `text-[0.78rem]`, `text-[0.8rem]`, `text-[0.82rem]`, `text-[0.85rem]`, `text-[0.88rem]`, `text-[0.9rem]`, `text-[0.92rem]`, `text-[0.95rem]`, `text-[1.05rem]`, `text-[1.4rem]`, `text-[1.8rem]`.

Non esiste una scala tipografica definita. Testi a `0.65rem` (~10.4px) e `0.68rem` (~10.9px) sono sotto la soglia di leggibilita WCAG.

**Recommendation:**
Definire una scala tipografica ristretta (5-7 step) in `globals.css` e usarla ovunque:

```css
@theme inline {
  --font-size-2xs: 0.6875rem;  /* 11px - minimum */
  --font-size-xs:  0.75rem;    /* 12px */
  --font-size-sm:  0.8125rem;  /* 13px */
  --font-size-base: 0.875rem;  /* 14px */
  --font-size-lg:  1rem;       /* 16px */
  --font-size-xl:  1.25rem;    /* 20px */
  --font-size-2xl: 1.75rem;    /* 28px */
}
```

---

### M2: Colori hardcoded bypassano i token

**Severity:** Major
**Location:** Multipli file
**Category:** Visual Design / Maintainability

**Problem:**
Diversi colori sono hardcoded fuori dal sistema di token semantici:

| Colore | Dove | Dovrebbe essere |
|--------|------|-----------------|
| `bg-red-500` | Cart badge (header) | `bg-destructive` |
| `hover:text-red-500` | Cart item remove | `hover:text-destructive` |
| `text-green-600 dark:text-green-400` | Success messages (3x) | Token `--success` mancante |
| `rgba(212,128,42,0.1)` | Chat input focus shadow | `var(--primary)` con opacity |
| `bg-yellow-100 text-yellow-800` etc. | STATUS_LABELS in constants.ts | Token semantici per status |

**Recommendation:**
1. Aggiungere `--success: #16a34a` / `--success: #22c55e` (dark) ai token
2. Sostituire colori raw con token semantici
3. Per STATUS_LABELS, valutare badge variants dedicati o token `--status-*`

---

### M3: Admin layout non responsive

**Severity:** Major
**Location:** `src/components/layout/admin-layout.tsx`
**Category:** Usability

**Problem:**
La sidebar admin (220px) e sempre visibile, anche su schermi stretti. Non c'e breakpoint per collassarla. Su mobile, il contenuto e compresso.

**Recommendation:**
Implementare sidebar collassabile sotto `md:` breakpoint, con hamburger menu — stesso pattern del cart sidebar nel dashboard.

---

### M4: Mobile cart overlay senza focus trap e keyboard close

**Severity:** Major
**Location:** `src/components/layout/dashboard-layout.tsx`
**Category:** Usability / Accessibility

**Problem:**
- Il cart mobile overlay non intrappola il focus (l'utente puo tabulare fuori)
- Nessun handler per Escape key
- `<aside>` senza `aria-label`
- Stessi problemi per il filtro mobile in `CatalogFiltersPanel`

**Recommendation:**
Usare il componente `<Sheet>` gia presente nel progetto (non attualmente utilizzato) per il cart mobile — include focus trap, Escape handler, e accessibilita built-in.

---

### M5: `alert()` per conferma/errore ordini

**Severity:** Major
**Location:** `src/components/order-popup/order-popup.tsx`
**Category:** Usability

**Problem:**
L'esito dell'invio ordine usa `alert()` browser nativo — blocca il thread, aspetto non professionale per una demo investitori.

**Recommendation:**
Usare un toast/notification system (es. `sonner` o un componente custom) per feedback non-bloccante.

---

### M6: `<Table>` e `<Sheet>` UI components non utilizzati

**Severity:** Major
**Location:** `src/components/ui/table.tsx`, `src/components/ui/sheet.tsx`
**Category:** Code Quality

**Problem:**
I componenti `<Table>` e `<Sheet>` di shadcn sono presenti ma non utilizzati. Tutte le tabelle usano HTML raw (`<table>`, `<thead>`, etc.) e il cart mobile usa positioning manuale.

**Impact:**
- Styling tabelle inconsistente tra pagine
- Il cart perde focus trap e accessibilita di Sheet
- Dead code nel bundle

**Recommendation:**
Migrare le tabelle al componente `<Table>` per consistenza, oppure rimuovere `table.tsx` e `sheet.tsx` se non servono.

---

### M7: No `aria-current="page"` su navigazione attiva

**Severity:** Major
**Location:** `src/components/layout/dashboard-header.tsx`, `src/components/layout/admin-layout.tsx`
**Category:** Accessibility

**Problem:**
I nav item attivi cambiano solo stile visivo (`bg-primary/10 text-primary`) senza `aria-current="page"`.

**Recommendation:**
```tsx
<Link href="/catalog" aria-current={pathname === "/catalog" ? "page" : undefined}>
```

---

### M8: Cart toggle e qty buttons senza accessible names

**Severity:** Major
**Location:** `src/components/layout/dashboard-header.tsx`, `src/components/cart/cart-item.tsx`, `src/components/catalog/qty-popover.tsx`
**Category:** Accessibility

**Problem:**
- Cart toggle button: no `aria-label`
- Qty `-`/`+` buttons: no `aria-label`
- Remove cart item button: no `aria-label`

**Recommendation:**
```tsx
<button aria-label="Apri carrello">
<button aria-label="Diminuisci quantita">
<button aria-label="Aumenta quantita">
<button aria-label="Rimuovi dal carrello">
```

---

### M9: Loading states inconsistenti

**Severity:** Major
**Location:** Tutte le pagine
**Category:** Usability

**Problem:**
Solo `ProductGrid` ha skeleton loading (12 cards `animate-pulse`). Tutte le altre pagine mostrano solo testo "Caricamento..." senza skeleton ne spinner. Le pagine admin, ordini, chat hanno tutte un loading state minimale.

**Recommendation:**
Implementare almeno un spinner component riutilizzabile, oppure skeleton pattern per le tabelle admin e la lista ordini.

---

## Minor Issues

### m1: `scrollbar-none` non definito

**Location:** `src/components/catalog/category-bar.tsx`

La classe `scrollbar-none` non ha una utility Tailwind v4 corrispondente. Non avra effetto.

**Fix:** Aggiungere `@utility scrollbar-none { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }` in `globals.css`.

---

### m2: Hover scale inconsistente

**Location:** `src/components/catalog/add-to-cart-button.tsx` vs `inline-cart-button.tsx`

`hover:scale-105` in un file, `hover:scale-110` nell'altro per lo stesso tipo di interazione.

---

### m3: DialogFooter close button in inglese

**Location:** `src/components/ui/dialog.tsx`

Il `showCloseButton` renderizza "Close" invece di "Chiudi" — inconsistente con UI in italiano.

---

### m4: ProductCard hover border senza scopo interattivo

**Location:** `src/components/catalog/product-card.tsx`

La card ha `hover:border-primary` ma non e clickabile (solo il bottone cart lo e). Suggerisce interattivita inesistente.

---

### m5: Admin label troppo piccolo

**Location:** `src/components/layout/admin-layout.tsx`

Il label "ADMIN" nella sidebar usa `text-[0.68rem]` (~10.9px), sotto la soglia di leggibilita pratica.

---

### m6: Chat disclaimer troppo piccolo

**Location:** `src/components/chat/chat-input.tsx`

Il disclaimer sotto il chat input usa `text-[0.68rem]` (~10.9px).

---

### m7: Overlay backdrop opacity inconsistente

**Location:** `dashboard-layout.tsx` vs `dialog.tsx`

Cart mobile backdrop: `bg-black/35`. Dialog overlay: `bg-black/50`. Dovrebbero essere consistenti.

---

### m8: Status filter tabs senza semantica tab

**Location:** `src/app/admin/orders/page.tsx`

I filtri stato usano plain `<button>` senza `role="tablist"`, `role="tab"`, `aria-selected`.

---

### m9: No skip-to-content link

**Location:** `src/app/layout.tsx`

Manca `<a href="#main-content" class="sr-only focus:not-sr-only">Vai al contenuto</a>`.

---

### m10: `<Suspense>` senza fallback

**Location:** `src/app/orders/page.tsx`

`<Suspense>` wraps `useSearchParams()` ma senza `fallback` prop.

---

## Suggestions

### S1: Definire un design token file

Creare `.ui-design/design-system.json` con token formali per spacing scale, type scale, e color palette. Questo servira come reference per futuri sviluppi e onboarding.

### S2: Implementare toast system

Sostituire `alert()` con `sonner` o un toast component per feedback non-bloccante (ordini, errori, conferme). Migliora significativamente la percezione di qualita per la demo investitori.

### S3: Dark mode toggle manuale

Attualmente dark mode e solo `prefers-color-scheme` (sistema). Un toggle manuale e atteso dagli utenti e gia nei piani di Fase 3.

### S4: Immagini prodotto placeholder

Le card prodotto non hanno immagini — anche un placeholder generico per categoria migliorerebbe l'impatto visivo del catalogo per la demo.

### S5: Chart/grafici nella dashboard admin

Le KPI sono solo numeri — un mini grafico trend (sparkline) o un grafico ordini/settimana renderebbe la dashboard piu impressionante per la demo.

---

## Positive Observations

- **Token system ben strutturato**: I CSS custom properties per colori, radius, e sidebar sono completi e supportano dark mode
- **Hook pattern eccellente**: Separazione netta tra data fetching (hooks) e presentazione (componenti)
- **Cart animation**: `animate-cart-item-in` e un tocco di polish apprezzabile
- **Category bar con toggle**: UX intuitiva per filtrare per categoria
- **Inline price editing**: Pattern click-to-edit nel catalogo admin e ben implementato
- **DOMPurify su markdown**: Sanitizzazione corretta del contenuto chat
- **Skeleton loading nel catalogo**: Buon pattern con 12 placeholder cards
- **Brand identity coerente**: Il colore amber/orange (#d4802a) e applicato consistentemente come primary
- **Mobile cart**: Il breakpoint custom `--breakpoint-cart: 900px` e una soluzione pragmatica e funzionante

## Next Steps

1. **[Critico]** Migrare navigazione da `<button>` a `<Link>` + aggiungere `aria-current`
2. **[Critico]** Aggiungere `aria-label` a tutti gli elementi interattivi senza testo visibile
3. **[Critico]** Associare label-input nel form registrazione (`id`/`htmlFor`)
4. **[Major]** Rendere admin layout responsive (sidebar collassabile)
5. **[Major]** Definire scala tipografica ristretta e migrare i 16+ valori arbitrari
6. **[Major]** Sostituire `alert()` con toast system
7. **[Major]** Sostituire colori hardcoded con token semantici
8. **[Quick win]** Aggiungere `aria-live` alla chat + `aria-label` su input/send

---

_Generated by UI Design Review. Run `/ui-design:design-review` again after fixes._
