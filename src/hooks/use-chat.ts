"use client";

import { useCallback, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AI_CHAT_URL } from "@/lib/constants";
import { parseResponse } from "@/lib/cart-actions";
import { renderMarkdown } from "@/lib/markdown";
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";

        const res = await fetch(AI_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatInput: text.trim(),
            sessionId: sessionIdRef.current,
          }),
        });

        const ct = (res.headers.get("content-type") ?? "").toLowerCase();

        if (
          ct.includes("text/event-stream") ||
          ct.includes("application/x-ndjson")
        ) {
          // SSE streaming
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let full = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split("\n");
            for (const ln of lines) {
              const trimmed = ln.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;
              if (trimmed.startsWith("data: ")) {
                const dd = trimmed.slice(6);
                if (dd === "[DONE]") continue;
                try {
                  const j = JSON.parse(dd);
                  full += j.chunk || j.token || j.text || "";
                } catch {
                  full += dd;
                }
              } else if (trimmed.startsWith("{")) {
                try {
                  const j = JSON.parse(trimmed);
                  full += j.chunk || j.token || j.text || j.output || "";
                } catch {
                  full += trimmed;
                }
              }
            }
            // Update streaming message
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, text: full } : m,
              ),
            );
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
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: "Errore di comunicazione. Riprova.",
                  isStreaming: false,
                }
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
