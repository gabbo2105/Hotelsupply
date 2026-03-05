"use client";

interface SuggestionChipsProps {
  chips: string[];
  onChip: (text: string) => void;
}

export function SuggestionChips({ chips, onChip }: SuggestionChipsProps) {
  return (
    <>
      {chips.map((text) => (
        <button
          key={text}
          onClick={() => onChip(text)}
          className="rounded-full border bg-background px-3.5 py-1.5 text-[0.82rem] text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
        >
          {text}
        </button>
      ))}
    </>
  );
}
