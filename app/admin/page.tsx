import { getAdminDashboardStats } from "@/lib/admin/data";
import { Database, FileCheck2, FileText, HardDrive, Users } from "lucide-react";

const statCards = {
  totalUsers: {
    label: "Total users",
    description: "Registered accounts",
    icon: Users,
  },
  totalForms: {
    label: "Total forms",
    description: "All workflows",
    icon: FileText,
  },
  totalPublishedForms: {
    label: "Published forms",
    description: "Live public workflows",
    icon: FileCheck2,
  },
  totalSubmissions: {
    label: "Total submissions",
    description: "Customer responses",
    icon: Database,
  },
  totalGoogleDriveConnectedUsers: {
    label: "Drive connected",
    description: "Storage-ready users",
    icon: HardDrive,
  },
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <main className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
            Super Admin
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Platform overview
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor users, workflows, submissions, and storage readiness
                without exposing private submission contents.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <section
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              key={key}
            >
              {(() => {
                const card = statCards[key as keyof typeof statCards];
                const Icon = card.icon;

                return (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {card.description}
                    </p>
                  </>
                );
              })()}
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                {value}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
