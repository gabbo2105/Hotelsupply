"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminUser } from "@/lib/types";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase.rpc("admin_list_users");
      setIsLoading(false);
      if (err) {
        setError("Errore nel caricamento utenti.");
        return;
      }
      setUsers((data ?? []) as AdminUser[]);
    })();
  }, []);

  return { users, isLoading, error };
}
