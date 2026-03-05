"use client";

import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="flex w-[220px] shrink-0 flex-col border-r bg-sidebar">
          <div className="border-b px-4 py-3.5">
            <div className="text-[0.9rem] font-bold">
              Hotel Supply <span className="text-primary">Pro</span>
            </div>
            <div className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground">
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
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-1 border-t p-3">
            <p className="truncate px-2 text-[0.72rem] text-muted-foreground">
              {session?.user?.email}
            </p>
            <button
              onClick={() => router.push("/catalog")}
              className="flex w-full items-center rounded-lg px-3 py-1.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              &larr; Torna all&apos;app
            </button>
            <button
              onClick={() => {
                signOut();
                router.push("/login");
              }}
              className="flex w-full items-center rounded-lg px-3 py-1.5 text-[0.78rem] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              Esci
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] shrink-0 items-center border-b px-6">
            <h1 className="text-[0.95rem] font-bold">{title}</h1>
          </header>
          <ScrollArea className="flex-1">
            <main className="p-6">{children}</main>
          </ScrollArea>
        </div>
      </div>
    </AdminGuard>
  );
}
