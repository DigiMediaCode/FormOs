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
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
            Super Admin
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:mt-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Platform overview
              </h2>
              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-slate-600 sm:block">
                Monitor users, workflows, submissions, and storage readiness
                without exposing private submission contents.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {Object.entries(stats).map(([key, value]) => (
            <section
              className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-0 sm:rounded-3xl sm:p-5"
              key={key}
            >
              {(() => {
                const card = statCards[key as keyof typeof statCards];
                const Icon = card.icon;

                return (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-700 sm:mt-4 sm:text-sm">
                      {card.label}
                    </p>
                    <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                      {card.description}
                    </p>
                  </>
                );
              })()}
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">
                {value}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
