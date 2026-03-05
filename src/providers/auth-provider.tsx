"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/lib/types";

export interface AuthContextValue {
  session: Session | null;
  customer: Customer | null;
  isAdmin: boolean;
  isLoading: boolean;
  isRecovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    meta: Record<string, string>,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  clearRecovery: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function loadCustomer(uid: string): Promise<Customer | null> {
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("auth_user_id", uid)
    .single();
  return data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Detect recovery token in URL hash IMMEDIATELY (before any render/effect)
  // With implicit flow, Supabase redirects with #access_token=...&type=recovery
  const [hashHasRecovery] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.hash.includes("type=recovery");
    }
    return false;
  });

  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(hashHasRecovery);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) setCustomer(await loadCustomer(s.user.id));
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
      if (event === "SIGNED_IN" && s) {
        setCustomer(await loadCustomer(s.user.id));
      }
      if (event === "SIGNED_OUT") {
        setCustomer(null);
        setIsRecovery(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) return null;
      if (error.message === "Invalid login credentials")
        return "Email o password non corretti.";
      return error.message;
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      meta: Record<string, string>,
    ): Promise<{ error: string | null; needsConfirmation: boolean }> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      if (data.user && !data.session)
        return { error: null, needsConfirmation: true };
      return { error: null, needsConfirmation: false };
    },
    [],
  );

  const signOutFn = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updatePassword = useCallback(
    async (newPassword: string): Promise<string | null> => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return error.message;
      setIsRecovery(false);
      return null;
    },
    [],
  );

  const clearRecovery = useCallback(() => {
    setIsRecovery(false);
  }, []);

  const isAdmin =
    session?.user?.app_metadata?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        session,
        customer,
        isAdmin,
        isLoading,
        isRecovery,
        signIn,
        signUp,
        signOut: signOutFn,
        updatePassword,
        clearRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
