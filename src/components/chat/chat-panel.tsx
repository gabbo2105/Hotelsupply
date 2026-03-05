"use client";

import { useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useCart } from "@/hooks/use-cart";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { SuggestionChips } from "./suggestion-chips";
import { GREETING_CHIPS } from "@/lib/constants";

interface ChatPanelProps {
  chatHook: ReturnType<typeof useChat>;
}

export function ChatPanel({ chatHook }: ChatPanelProps) {
  const { messages, isBusy, showChips, sendMessage, initChat } = chatHook;

  useEffect(() => {
    if (messages.length === 0) initChat();
  }, [messages.length, initChat]);

  return (
    <div className="relative flex flex-1 flex-col">
      <MessageList messages={messages} />
      {showChips && (
        <div className="mx-auto flex max-w-[720px] flex-wrap gap-1.5 px-4">
          <SuggestionChips
            chips={GREETING_CHIPS}
            onChip={(text) => sendMessage(text)}
          />
        </div>
      )}
      <ChatInput onSend={sendMessage} disabled={isBusy} />
    </div>
  );
}
