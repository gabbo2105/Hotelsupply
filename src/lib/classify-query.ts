/**
 * Lightweight client-side classifier: decides whether a user query
 * should go to the instant catalog search or to the AI agent.
 *
 * "search" = direct hybrid search (fast, no AI)
 * "agent"  = conversational / complex query (needs AI reasoning)
 *
 * Design principle: prefer "search" when in doubt. It's fast and
 * the user can always escalate to the agent. False negatives (sending
 * a conversational query to search) are recoverable via auto-escalation.
 * False positives (sending a product query to agent) waste time.
 */

const AGENT_PATTERNS = [
  // Advice / reasoning requests
  /\b(consiglio|consigli|suggerisci|suggerimento|raccomand)/i,
  /\b(quale|quali)\b.{0,20}\b(migliore|migliori|meglio|consiglio)/i,
  /\b(cosa mi serve|di cosa ho bisogno|che mi serve)\b/i,
  // Occasions / conceptual queries ("prodotti per cena", "per un buffet")
  /\bper\s+(la\s+)?(cena|pranzo|colazione|brunch|aperitivo|merenda)\b/i,
  /\bper\s+\d+\s+persone\b/i,
  /\bper\s+(un|una|il|la|lo)\s+(buffet|evento|banchetto|matrimonio|festa|ricevimento|catering)\b/i,
  /\b(cosa servire|cosa preparare|menu|men[uù])\b/i,
  // Comparisons
  /\b(confronta|paragona|differenza tra|meglio tra)\b/i,
  // Cart actions (only when explicitly mentioning cart)
  /\b(aggiungi|metti|togli|rimuovi)\b.{0,30}\b(carrello|cart)\b/i,
  /\b(ordina|ordine)\b/i,
  // Business questions
  /\b(consegna|spedizione|pagamento|fattura|reso|garanzia|tempi)\b/i,
  /\b(come funziona|come faccio|aiut(o|ami)|spiegami)\b/i,
  // Greetings / chat
  /^(ciao|buongiorno|buonasera|salve|hey|hi|hello)\s*[!.,]?\s*$/i,
  /\b(grazie|perfetto|ok va bene)\s*[.!?]?\s*$/i,
  // Multi-sentence / complex (contains question mark after substance)
  /\?.{0,5}$/,
];

export type QueryIntent = "search" | "agent";

export function classifyQuery(text: string): QueryIntent {
  const trimmed = text.trim();

  // Very short (< 3 chars) → agent (likely incomplete / greeting)
  if (trimmed.length < 3) return "agent";

  // Check agent patterns
  let isAgent = false;
  for (const pattern of AGENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      isAgent = true;
      break;
    }
  }

  if (!isAgent) return "search";

  // Agent pattern matched — but check if it's actually a simple product query.
  // A question mark alone doesn't make it conversational if it's short and product-like.
  // e.g. "prosecco?" or "birra ipa?" → still search
  const isQuestionOnly =
    /\?.{0,5}$/.test(trimmed) && trimmed.length < 30;
  const hasOnlyQuestionPattern =
    isQuestionOnly &&
    !AGENT_PATTERNS.slice(0, -2).some((p) => p.test(trimmed)); // exclude greeting + question patterns
  if (hasOnlyQuestionPattern) return "search";

  return "agent";
}

/**
 * Returns true if the query looks like a follow-up in an existing
 * conversation (short response, pronoun-heavy, references previous context).
 */
export function isFollowUp(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) {
    // Short responses with pronouns or references
    if (/\b(questo|quella|questi|quelle|lo stesso|anche|ancora|altro|altri)\b/i.test(trimmed)) return true;
    // Affirmative / negative short responses
    if (/^(s[ìi]|no|ok|va bene|perfetto|esatto|proprio|giusto)/i.test(trimmed)) return true;
  }
  return false;
}
