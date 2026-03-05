const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const AI_CHAT_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;
export const SEND_ORDER_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-order-email`;

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "In attesa", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { label: "Confermato", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  shipped: { label: "Spedito", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  delivered: { label: "Consegnato", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export const GREETING_CHIPS = [
  "Che prosecco avete?",
  "Prodotti per la colazione",
  "Detersivi per la cucina",
  "Confronta prezzi Coca Cola",
];

export const CATALOG_PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "description", label: "A-Z" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
] as const;
