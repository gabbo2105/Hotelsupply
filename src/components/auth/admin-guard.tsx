"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
    if (!isLoading && session && !isAdmin) {
      router.replace("/catalog");
    }
  }, [isLoading, session, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return <>{children}</>;
}
