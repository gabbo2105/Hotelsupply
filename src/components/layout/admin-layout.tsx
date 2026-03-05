"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AdminGuard } from "@/components/auth/admin-guard";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Ordini" },
  { href: "/admin/catalog", label: "Catalogo" },
  { href: "/admin/users", label: "Utenti" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { session, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="border-b px-4 py-3.5">
        <div className="text-sm font-bold">
          Hotel Supply <span className="text-primary">Pro</span>
        </div>
        <div className="mt-0.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setSidebarOpen(false)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-2sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t p-3">
        <p className="truncate px-2 text-xs text-muted-foreground">
          {session?.user?.email}
        </p>
        <Link
          href="/catalog"
          className="flex w-full items-center rounded-lg px-3 py-1.5 text-2sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          &larr; Torna all&apos;app
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center rounded-lg px-3 py-1.5 text-2sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          Esci
        </button>
      </div>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r bg-sidebar">
          {sidebarContent}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-sidebar shadow-xl">
              {sidebarContent}
            </aside>
          </>
        )}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] shrink-0 items-center gap-3 border-b px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu"
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-base font-bold">{title}</h1>
          </header>
          <ScrollArea className="flex-1">
            <main className="p-4 md:p-6">{children}</main>
          </ScrollArea>
        </div>
      </div>
    </AdminGuard>
  );
}
