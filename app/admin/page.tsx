import { getAdminDashboardStats } from "@/lib/admin/data";

const statLabels = {
  totalUsers: "Total users",
  totalForms: "Total forms",
  totalPublishedForms: "Published forms",
  totalSubmissions: "Total submissions",
  totalGoogleDriveConnectedUsers: "Google Drive connected users",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950">
          Admin Dashboard
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <section className="rounded-md border border-slate-200 bg-white p-5" key={key}>
              <p className="text-sm font-medium text-slate-600">
                {statLabels[key as keyof typeof statLabels]}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {value}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
