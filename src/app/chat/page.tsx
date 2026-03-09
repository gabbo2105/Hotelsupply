"use client";

import { useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useCart } from "@/hooks/use-cart";
import { useChat } from "@/hooks/use-chat";
import { ChatThread } from "@/components/fluid/chat-thread";
import { FluidInput } from "@/components/fluid/fluid-input";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { Sparkles } from "lucide-react";

const CHAT_CHIPS = [
  "Che prosecco avete per un aperitivo?",
  "Confronta prezzi Coca Cola",
  "Prodotti senza glutine per la colazione",
  "Consiglia vini rossi sotto 15 euro",
];

export default function ChatPage() {
  const { itemCount } = useCart();
  const chatHook = useChat();

  useEffect(() => {
    chatHook.initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      chatHook.sendMessage(text.trim());
    },
    [chatHook],
  );

  const handleNewChat = useCallback(() => {
    chatHook.newChat();
  }, [chatHook]);

  const hasMessages = chatHook.messages.length > 1;

  return (
    <DashboardLayout
      sidebar={<CartSidebar />}
      cartCount={itemCount}
      onNewChat={handleNewChat}
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto pb-24">
          {!hasMessages ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 pt-16">
              <div className="w-full max-w-[640px] space-y-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Assistente AI
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Chiedi consigli, confronta prodotti o fatti aiutare con il tuo ordine.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <SuggestionChips chips={CHAT_CHIPS} onChip={handleSend} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[960px] px-4 pt-4">
              <ChatThread
                messages={chatHook.messages}
                isStreaming={chatHook.isStreaming}
              />
            </div>
          )}
        </div>

        <FluidInput
          onSend={handleSend}
          disabled={chatHook.isBusy}
          mode="agent"
        />
      </div>
    </DashboardLayout>
  );
}
