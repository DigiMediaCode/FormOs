import type { ReactNode } from "react";
import { AdminShell } from "@/components/ui/admin-shell";
import { requireSuperAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireSuperAdmin();

  return (
    <AdminShell userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
