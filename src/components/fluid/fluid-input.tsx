"use client";

import { useRef, useState } from "react";
import { Send, Sparkles, Search } from "lucide-react";

type InputMode = "welcome" | "search" | "agent";

interface FluidInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  mode?: InputMode;
}

const PLACEHOLDERS: Record<InputMode, string> = {
  welcome: "Cerca prodotti o chiedi all'assistente AI...",
  search: "Affina la ricerca...",
  agent: "Continua la conversazione con l'AI...",
};

export function FluidInput({ onSend, disabled, mode = "welcome" }: FluidInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  }

  const isAgent = mode === "agent";
  const Icon = isAgent ? Sparkles : Search;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background from-40% to-transparent px-4 pb-4 pt-3">
      <div className="pointer-events-auto mx-auto flex max-w-[720px] items-center gap-2 rounded-full border bg-background/80 px-4 py-1 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary focus-within:shadow-xl focus-within:shadow-primary/10">
        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isAgent ? "text-primary" : "text-muted-foreground/50"}`} />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={PLACEHOLDERS[mode]}
          aria-label={PLACEHOLDERS[mode]}
          disabled={disabled}
          className="flex-1 border-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Invia"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary/40 active:scale-95 disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none disabled:hover:scale-100"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="pointer-events-auto mx-auto mt-1.5 max-w-[720px] text-center text-2xs text-muted-foreground">
        {isAgent
          ? "Stai parlando con l'assistente AI"
          : "Cerca nel catalogo o chiedi consigli all'AI"}
      </p>
    </div>
  );
}
