import Link from "next/link";
import { updateProfileAction } from "@/app/dashboard/settings/profile/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function inputClass() {
  return "rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
}

function Field({
  defaultValue,
  label,
  name,
  readOnly = false,
  type = "text",
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
      {label}
      <input
        className={`${inputClass()} ${readOnly ? "bg-slate-100 text-slate-500" : ""}`}
        defaultValue={defaultValue ?? ""}
        name={name}
        readOnly={readOnly}
        type={type}
      />
    </label>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();
  const { error, success } = await searchParams;

  if (!user) {
    return null;
  }

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Profile / Business Profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Keep your personal and business details ready for future billing and invoices.
          </p>
        </header>

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={updateProfileAction} className="grid gap-6">
          <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Personal Details</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field defaultValue={user.firstName} label="First Name" name="firstName" />
              <Field defaultValue={user.lastName} label="Last Name" name="lastName" />
              <Field defaultValue={user.email} label="Email" name="email" readOnly type="email" />
              <Field defaultValue={user.phone} label="Phone" name="phone" />
            </div>
          </section>

          <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Business Details</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field defaultValue={businessProfile?.companyName} label="Company / Business Name" name="companyName" />
              <Field defaultValue={businessProfile?.taxId} label="ABN / Tax ID" name="taxId" />
              <Field defaultValue={businessProfile?.taxIdLabel ?? "ABN"} label="Tax ID Label" name="taxIdLabel" />
              <Field defaultValue={businessProfile?.phone} label="Business Phone" name="businessPhone" />
              <Field defaultValue={businessProfile?.billingEmail} label="Billing Email" name="billingEmail" type="email" />
              <Field defaultValue={businessProfile?.billingName} label="Billing Name" name="billingName" />
            </div>
          </section>

          <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Address</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field defaultValue={businessProfile?.addressLine1} label="Address Line 1" name="addressLine1" />
              <Field defaultValue={businessProfile?.addressLine2} label="Address Line 2" name="addressLine2" />
              <Field defaultValue={businessProfile?.city} label="City" name="city" />
              <Field defaultValue={businessProfile?.state} label="State" name="state" />
              <Field defaultValue={businessProfile?.postcode} label="Postcode" name="postcode" />
              <Field defaultValue={businessProfile?.country} label="Country" name="country" />
            </div>
          </section>

          <SubmitButton
            className="w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Saving profile..."
          >
            Save Profile
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
