"use client";

import { useEffect, useRef } from "react";
import { AIBanner } from "@/components/fluid/ai-banner";
import { User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface ChatThreadProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatThread({ messages, isStreaming }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Skip the initial greeting if present (first bot message before any user message)
  const firstIsGreeting =
    messages.length > 0 &&
    messages[0].role === "bot" &&
    (messages.length < 2 || messages[1].role === "user");
  const thread = firstIsGreeting ? messages.slice(1) : messages;

  if (thread.length === 0 && !isStreaming) return null;

  return (
    <div className="flex flex-col gap-3">
      {thread.map((msg) =>
        msg.role === "user" ? (
          <div key={msg.id} className="flex items-start gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-2sm leading-relaxed text-foreground/90 pt-0.5">
              {msg.text}
            </p>
          </div>
        ) : (
          <AIBanner
            key={msg.id}
            text={msg.text}
            isStreaming={msg.isStreaming === true}
          />
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
