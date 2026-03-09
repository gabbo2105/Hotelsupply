"use client";

import { useCallback, useRef, useState } from "react";
import { supabase, supabaseAnonKey } from "@/lib/supabase";
import { AI_CHAT_URL } from "@/lib/constants";
import { parseResponse } from "@/lib/cart-actions";
import type { ChatMessage } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

export function useChat() {
  const { customer } = useAuth();
  const { applyCartActions, flushSync } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Initialize chat with greeting
  const initChat = useCallback(() => {
    const name = customer?.contact_person?.split(" ")[0] ?? "";
    const greeting = `${name ? `Ciao **${name}**!` : "Ciao!"}\n\nSono il tuo assistente per gli acquisti. Posso cercare prodotti, confrontare prezzi e gestire il tuo carrello.\n\nCosa posso fare per te?`;
    sessionIdRef.current = crypto.randomUUID();
    setMessages([{ id: crypto.randomUUID(), role: "bot", text: greeting }]);
    setShowChips(true);
    setIsBusy(false);
    setIsStreaming(false);
  }, [customer?.contact_person]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isBusy || !text.trim()) return;
      setShowChips(false);
      setIsBusy(true);

      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add streaming placeholder
      const botMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "bot", text: "", isStreaming: true },
      ]);
      setIsStreaming(true);

      // Flush cart before sending
      await flushSync();

      try {
        // Get token — refresh if expired
        let token = "";
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        } else {
          const { data: refreshed } = await supabase.auth.refreshSession();
          token = refreshed.session?.access_token ?? "";
        }

        if (!token) throw new Error("auth");
        console.log("[chat] token ok, calling", AI_CHAT_URL);

        let res = await fetch(AI_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            chatInput: text.trim(),
            sessionId: sessionIdRef.current,
          }),
        });

        // Retry once on 401 with refreshed token
        if (res.status === 401) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          const newToken = refreshed.session?.access_token;
          if (!newToken) throw new Error("auth");
          res = await fetch(AI_CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              chatInput: text.trim(),
              sessionId: sessionIdRef.current,
            }),
          });
        }

        if (!res.ok) throw new Error("server");

        const ct = (res.headers.get("content-type") ?? "").toLowerCase();

        if (ct.includes("text/event-stream")) {
          // SSE streaming with line buffer for split chunks
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let full = "";
          let lineBuffer = "";

          const TOOL_LABELS: Record<string, string> = {
            search_products: "Cerco nel catalogo…",
            search_products_semantic: "Ricerca semantica…",
            read_cart: "Leggo il carrello…",
            get_customer: "Recupero profilo…",
            send_email: "Invio email…",
          };

          let statusText = "";
          // Deduplicate repeated status labels across tool rounds
          const seenTools = new Set<string>();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split("\n");
            // Keep last (possibly incomplete) line in buffer
            lineBuffer = lines.pop() ?? "";

            for (const ln of lines) {
              const trimmed = ln.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;
              if (trimmed.startsWith("data: ")) {
                const dd = trimmed.slice(6);
                if (dd === "[DONE]") continue;
                try {
                  const j = JSON.parse(dd);

                  // Error event from backend
                  if (j.error) {
                    full = "Errore di comunicazione. Riprova.";
                    continue;
                  }

                  // Status event — accumulate unique tool labels across rounds
                  if (j.status === "tools" && Array.isArray(j.tools)) {
                    for (const t of j.tools as string[]) seenTools.add(t);
                    statusText = [...seenTools]
                      .map((t) => TOOL_LABELS[t] || t)
                      .join(" · ");
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === botMsgId
                          ? { ...m, text: statusText, isStreaming: true }
                          : m,
                      ),
                    );
                    continue;
                  }

                  // Content chunk — clear status and append
                  if (j.chunk || j.token || j.text) {
                    if (statusText) {
                      full = "";
                      statusText = "";
                    }
                    full += j.chunk || j.token || j.text || "";
                  }
                } catch {
                  // Malformed JSON — skip (don't append raw data)
                }
              }
            }
            // Update streaming message with content
            if (!statusText && full) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, text: full } : m,
                ),
              );
            }
          }

          // Parse final response
          const parsed = parseResponse(full);
          if (parsed.cartActions.length) applyCartActions(parsed.cartActions);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, text: parsed.text, isStreaming: false }
                : m,
            ),
          );
        } else {
          // Standard JSON response
          const data = await res.json();
          const raw =
            typeof data === "string"
              ? data
              : data.output ||
                data.text ||
                data.response ||
                data.message ||
                JSON.stringify(data);
          const parsed = parseResponse(raw);
          if (parsed.cartActions.length) applyCartActions(parsed.cartActions);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, text: parsed.text, isStreaming: false }
                : m,
            ),
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "auth"
            ? "Sessione scaduta. Effettua nuovamente il login."
            : "Errore di comunicazione. Riprova.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, text: msg, isStreaming: false }
              : m,
          ),
        );
      }

      setIsStreaming(false);
      setIsBusy(false);
    },
    [isBusy, flushSync, applyCartActions],
  );

  const newChat = useCallback(() => {
    initChat();
  }, [initChat]);

  return {
    messages,
    isStreaming,
    isBusy,
    showChips,
    sendMessage,
    newChat,
    initChat,
  };
}
