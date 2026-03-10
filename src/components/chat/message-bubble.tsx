"use client";

import type { ChatMessage } from "@/lib/types";
import { MessageBody } from "./message-body";
import { TypingIndicator } from "./typing-indicator";
import { esc } from "@/lib/format";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className="rounded-lg border-b py-5 transition-colors first:pt-0 last:border-b-0 hover:bg-muted/30">
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-2xs font-bold shadow-sm ${
            isUser
              ? "bg-muted text-muted-foreground"
              : "bg-gradient-to-br from-primary to-primary/80 text-white"
          }`}
        >
          {isUser ? "Tu" : "HS"}
        </div>
        <div
          className={`text-2sm font-semibold ${
            isUser ? "text-muted-foreground" : "text-primary"
          }`}
        >
          {isUser ? "Tu" : "Hotel Supply Pro"}
        </div>
      </div>

      {message.isStreaming && !message.text ? (
        <TypingIndicator />
      ) : isUser ? (
        <div
          className="msg-body text-sm leading-[1.7]"
          dangerouslySetInnerHTML={{
            __html: esc(message.text).replace(/\n/g, "<br>"),
          }}
        />
      ) : (
        <MessageBody text={message.text} isStreaming={message.isStreaming} products={message.products} />
      )}
    </div>
  );
}
