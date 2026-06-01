import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <LinkLogo />
            <DashboardNav />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">
              {user.name ? `${user.name} (${user.email})` : user.email}
            </p>
            <form action={logoutAction}>
              <SubmitButton
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                pendingText="Signing out..."
                showStatus={false}
              >
                Log out
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function LinkLogo() {
  return (
    <PlatformBrand
      href="/dashboard"
      imageClassName="h-auto max-w-[110px] object-contain"
      textClassName="text-lg font-semibold text-slate-950"
    />
  );
}
