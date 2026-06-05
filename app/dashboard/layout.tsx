import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceContext = await getWorkspaceContextForCurrentUser();

  return (
    <DashboardShell
      canManageOwnerSettings={workspaceContext?.canManageOwnerSettings ?? true}
      isSuperAdmin={user.role === "SUPER_ADMIN"}
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </DashboardShell>
  );
}
