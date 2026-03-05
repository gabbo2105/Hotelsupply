"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password: minimo 6 caratteri.");
      return;
    }
    if (password !== password2) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      router.replace("/chat");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Hotel Supply <span className="text-primary">Pro</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Imposta la nuova password
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-card p-7 shadow-md"
        >
          <div className="space-y-1">
            <Label htmlFor="new-password">Nuova password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Min 6 caratteri"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-2 space-y-1">
            <Label htmlFor="confirm-password">Conferma password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Ripeti password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
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
            {loading ? "Salvataggio..." : "Salva password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
