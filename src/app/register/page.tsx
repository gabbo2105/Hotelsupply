"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/chat");
    }
  }, [isLoading, session, router]);

  if (isLoading) return null;
  if (session) return null;

  return <RegisterForm />;
}
