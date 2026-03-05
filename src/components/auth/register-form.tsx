"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
    if (!companyName || !vatNumber || !hotelName || !contactPerson) {
      setError("Compila tutti i campi con *.");
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, {
      company_name: companyName,
      vat_number: vatNumber,
      hotel_name: hotelName,
      hotel_address: hotelAddress,
      contact_person: contactPerson,
      contact_role: contactRole,
      phone,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.needsConfirmation) {
      setSuccess(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-[520px]">
        <div className="mb-7 text-center">
          <h1 className="text-[1.4rem] font-bold tracking-tight">
            Hotel Supply <span className="text-primary">Pro</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea il tuo account gratuito
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-card p-7 shadow-md"
        >
          {/* Accesso */}
          <SectionTitle first>Accesso</SectionTitle>
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="email@esempio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Min 6 caratteri"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Conferma *</Label>
              <Input
                type="password"
                placeholder="Ripeti password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>
          </div>

          {/* Azienda */}
          <SectionTitle>Azienda</SectionTitle>
          <div className="space-y-1">
            <Label>Ragione sociale *</Label>
            <Input
              placeholder="Hotel Roma S.r.l."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="mt-2 space-y-1">
            <Label>Partita IVA *</Label>
            <Input
              placeholder="IT01234567890"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
            />
          </div>

          {/* Hotel */}
          <SectionTitle>Hotel</SectionTitle>
          <div className="space-y-1">
            <Label>Nome hotel *</Label>
            <Input
              placeholder="Grand Hotel Roma"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
            />
          </div>
          <div className="mt-2 space-y-1">
            <Label>Indirizzo</Label>
            <Input
              placeholder="Via Roma 1, Roma"
              value={hotelAddress}
              onChange={(e) => setHotelAddress(e.target.value)}
            />
          </div>

          {/* Referente */}
          <SectionTitle>Referente</SectionTitle>
          <div className="space-y-1">
            <Label>Nome e cognome *</Label>
            <Input
              placeholder="Mario Rossi"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Ruolo</Label>
              <Input
                placeholder="Resp. acquisti"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Telefono</Label>
              <Input
                type="tel"
                placeholder="+39 333 123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              Account creato! Controlla email e poi accedi.
            </p>
          )}

          <Button
            type="submit"
            className="mt-4 w-full"
            disabled={loading || success}
          >
            {loading ? "Creazione..." : "Crea Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  first,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <h3
      className={`text-xs font-bold uppercase tracking-wider text-primary ${first ? "mb-2" : "mb-2 mt-5"}`}
    >
      {children}
    </h3>
  );
}
