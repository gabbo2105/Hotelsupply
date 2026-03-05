"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(session ? "/catalog" : "/login");
    }
  }, [isLoading, session, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Caricamento...</p>
    </div>
  );
}
