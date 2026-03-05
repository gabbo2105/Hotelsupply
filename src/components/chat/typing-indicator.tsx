"use client";

export function TypingIndicator() {
  return (
    <div className="flex gap-1.5">
      <span className="h-2 w-2 animate-typing-bounce rounded-full bg-muted-foreground" />
      <span className="h-2 w-2 animate-typing-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
      <span className="h-2 w-2 animate-typing-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
    </div>
  );
}
