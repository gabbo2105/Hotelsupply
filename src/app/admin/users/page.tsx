"use client";

import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { fmtDate } from "@/lib/format";

export default function AdminUsersPage() {
  const { users, isLoading, error } = useAdminUsers();

  return (
    <AdminLayout title="Utenti Registrati">
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Caricamento...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4 text-[0.78rem] text-muted-foreground">
            {users.length} utenti registrati
          </div>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {[
                    "Hotel",
                    "Azienda",
                    "P.IVA",
                    "Contatto",
                    "Email",
                    "Ultimo accesso",
                    "Registrato",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-semibold">
                      {u.hotel_name}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {u.company_name}
                    </td>
                    <td className="px-4 py-2.5 text-[0.78rem] text-muted-foreground">
                      {u.vat_number}
                    </td>
                    <td className="px-4 py-2.5 text-[0.82rem]">
                      {u.contact_person}
                      {u.phone && (
                        <span className="ml-1 text-muted-foreground">
                          &middot; {u.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[0.8rem] text-primary">
                      {u.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[0.78rem] text-muted-foreground">
                      {u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[0.78rem] text-muted-foreground">
                      {fmtDate(u.created_at)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Nessun utente registrato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
