"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Compila email e password.");
      return;
    }
    setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace("/chat");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Inserisci la tua email.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess("Email di reset inviata! Controlla la tua casella di posta.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <h1 className="text-[1.4rem] font-bold tracking-tight">
            Hotel Supply <span className="text-primary">Pro</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotMode ? "Recupera la tua password" : "Accedi al tuo account"}
          </p>
        </div>

        {forgotMode ? (
          <form
            onSubmit={handleResetPassword}
            className="rounded-2xl border bg-card p-7 shadow-md"
          >
            <div className="space-y-1">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="email@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            )}

            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={loading}
            >
              {loading ? "Invio..." : "Invia email di reset"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setError("");
                setSuccess("");
              }}
              className="mt-3 w-full text-center text-sm text-primary hover:underline"
            >
              Torna al login
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-card p-7 shadow-md"
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mt-2 space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={loading}
            >
              {loading ? "Caricamento..." : "Accedi"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setError("");
              }}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-primary"
            >
              Password dimenticata?
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Non hai un account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
