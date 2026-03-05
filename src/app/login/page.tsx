"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function LoginPage() {
  const { session, isLoading, isRecovery } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session && !isRecovery) {
      router.replace("/chat");
    }
  }, [isLoading, session, isRecovery, router]);

  if (isLoading) return null;

  if (isRecovery) return <ResetPasswordForm />;

  if (session) return null;

  return <LoginForm />;
}
