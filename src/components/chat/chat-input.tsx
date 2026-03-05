"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background from-40% to-transparent px-4 pb-4 pt-3">
      <div className="pointer-events-auto mx-auto flex max-w-[720px] items-center gap-2 rounded-3xl border bg-background px-4 py-1 shadow-sm transition-all focus-within:border-primary focus-within:shadow-[0_0_0_2px_rgba(212,128,42,0.1)]">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Scrivi un messaggio..."
          aria-label="Scrivi un messaggio"
          disabled={disabled}
          className="flex-1 border-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Invia messaggio"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="pointer-events-auto mx-auto mt-1.5 max-w-[720px] text-center text-2xs text-muted-foreground">
        Hotel Supply Pro può commettere errori. Verifica le informazioni
        importanti.
      </p>
    </div>
  );
}
