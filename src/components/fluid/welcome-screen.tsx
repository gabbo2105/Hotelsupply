"use client";

import { Search } from "lucide-react";

interface WelcomeScreenProps {
  customerName?: string;
}

export function WelcomeScreen({ customerName }: WelcomeScreenProps) {
  const name = customerName?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-[640px] space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {name ? `Ciao ${name}!` : "Ciao!"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cerca prodotti nel catalogo.
          </p>
        </div>
      </div>
    </div>
  );
}
