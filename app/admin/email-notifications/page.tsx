import Link from "next/link";
import { Mail, Plus, RefreshCw, Save, Send, Sparkles } from "lucide-react";
import {
  createEmailTemplateAction,
  resetEmailTemplateAction,
  saveEmailTemplateAction,
  seedDefaultEmailTemplatesAction,
  sendBroadcastEmailAction,
} from "@/app/admin/email-notifications/actions";
import { RichContentEditor } from "@/components/admin/rich-content-editor";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  ALL_EMAIL_TEMPLATE_VARIABLES,
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  seedDefaultEmailTemplatesIfMissing,
  type EmailTemplateKey,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";

type EmailNotificationsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function EmailNotificationsPage({
  searchParams,
}: EmailNotificationsPageProps) {
  const user = await requireSuperAdmin();
  await seedDefaultEmailTemplatesIfMissing(user.id);
  const { error, success } = await searchParams;
  const savedTemplates = await prisma.emailTemplate.findMany();
  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
  const templatesByKey = new Map(savedTemplates.map((template) => [template.key, template]));
  const customTemplates = savedTemplates
    .filter((template) => !(EMAIL_TEMPLATE_KEYS as readonly string[]).includes(template.key))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Email Notifications
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Edit subjects, text bodies, and safe optional HTML for FormOS notification emails.
            </p>
          </div>
          <form action={seedDefaultEmailTemplatesAction}>
            <SubmitButton
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              pendingText="Checking templates..."
              showStatus={false}
            >
              <Sparkles className="size-4 text-blue-600" />
              Seed Defaults
            </SubmitButton>
          </form>
        </header>

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Use placeholders like <code>{"{{formTitle}}"}</code> and{" "}
          <code>{"{{dashboardLink}}"}</code>. HTML is optional and sanitized; scripts,
          iframes, forms, event handlers, and <code>javascript:</code> links are stripped.
          For email images, upload to{" "}
          <Link className="font-semibold underline" href="/admin/media">
            Media Library
          </Link>{" "}
          and use the generated <code>/media/...</code> path in safe HTML.
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Send className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Send Email Broadcast
              </h3>
              <p className="text-xs leading-5 text-slate-500">
                Send announcements or promotions to all active, non-suspended FormOS users.
                Personalize with <code>{"{{userName}}"}</code>,{" "}
                <code>{"{{firstName}}"}</code>, and <code>{"{{userEmail}}"}</code>.
              </p>
            </div>
          </div>

          <form action={sendBroadcastEmailAction} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Campaign Name
                <input
                  className={inputClass}
                  name="name"
                  placeholder="June promotion"
                  required
                />
              </label>
              <label className={labelClass}>
                Subject
                <input
                  className={inputClass}
                  name="subject"
                  placeholder="A FormOS update for {{firstName}}"
                  required
                />
              </label>
            </div>
            <label className={labelClass}>
              Text Body
              <textarea
                className={`${inputClass} min-h-36 font-mono text-xs leading-6`}
                name="textBody"
                placeholder={"Hi {{userName}},\n\nHere is what is new in FormOS..."}
                required
              />
            </label>
            <div className={labelClass}>
              <span>Optional HTML Body</span>
              <RichContentEditor
                help="Use formatting and insert photos or videos. Uploaded media is stored in the FormOS Media Library. Video may appear as a link or fallback in some email clients."
                initialHtml={'<p>Hi {{userName}},</p><p>Here is what is new in FormOS...</p>'}
                label="Rich HTML Body"
                name="htmlBody"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-slate-500">
                This sends immediately through the configured email provider. It does not expose
                Lark tokens, app secrets, or payment data.
              </p>
              <ConfirmSubmitButton
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                confirmMessage="Send this email broadcast to all active users now?"
                pendingText="Sending broadcast..."
              >
                <Send className="size-4" />
                Send Broadcast
              </ConfirmSubmitButton>
            </div>
          </form>

          {campaigns.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Campaign</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Recipients</th>
                    <th className="px-3 py-2 font-semibold">Sent</th>
                    <th className="px-3 py-2 font-semibold">Failed</th>
                    <th className="px-3 py-2 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-950">{campaign.name}</p>
                        <p className="max-w-xs truncate text-xs text-slate-500">
                          {campaign.subject}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-600">
                        {campaign.status}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {campaign.recipientCount}
                      </td>
                      <td className="px-3 py-2 text-emerald-700">
                        {campaign.sentCount}
                      </td>
                      <td className="px-3 py-2 text-red-700">
                        {campaign.failedCount}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {formatDate(campaign.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Plus className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Create Custom Email Template
              </h3>
              <p className="text-xs leading-5 text-slate-500">
                Custom templates are saved for future/admin use. Built-in system emails use the templates below.
              </p>
            </div>
          </div>
          <form action={createEmailTemplateAction} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Name
                <input className={inputClass} name="name" placeholder="Payment reminder" required />
              </label>
              <label className={labelClass}>
                Template Key
                <input className={inputClass} name="key" placeholder="payment_reminder" required />
              </label>
            </div>
            <label className={labelClass}>
              Description
              <input className={inputClass} name="description" placeholder="Internal note for this template." />
            </label>
            <label className={labelClass}>
              Subject
              <input className={inputClass} name="subject" required />
            </label>
            <label className={labelClass}>
              Text Body
              <textarea className={`${inputClass} min-h-32 font-mono text-xs leading-6`} name="textBody" required />
            </label>
            <div className={labelClass}>
              <span>Optional HTML Body</span>
              <RichContentEditor
                help="Optional formatted version. Media uploads go to the Media Library."
                label="Rich HTML Body"
                name="htmlBody"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                  name="isActive"
                  type="checkbox"
                />
                Active
              </label>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                pendingText="Creating template..."
                showStatus={false}
              >
                <Plus className="size-4" />
                Create Template
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="grid gap-4">
          {EMAIL_TEMPLATE_KEYS.map((key) => {
            const defaults = DEFAULT_EMAIL_TEMPLATES[key];
            const template = templatesByKey.get(key);
            const subject = template?.subject ?? defaults.subject;
            const textBody = template?.textBody ?? defaults.textBody;
            const htmlBody = template?.htmlBody ?? defaults.htmlBody ?? "";
            const isActive = template?.isActive ?? true;

            return (
              <article
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                key={key}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Mail className="size-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">
                          {defaults.name}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {defaults.description}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Key: {key} · Updated: {formatDate(template?.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <form action={resetEmailTemplateAction.bind(null, key as EmailTemplateKey)}>
                    <ConfirmSubmitButton
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      confirmMessage="Reset this template to the FormOS default?"
                      pendingText="Resetting..."
                    >
                      <RefreshCw className="size-4" />
                      Reset
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <form action={saveEmailTemplateAction} className="grid gap-3">
                  <input name="key" type="hidden" value={key} />
                  <div className="flex flex-wrap gap-2">
                    {ALL_EMAIL_TEMPLATE_VARIABLES.map((variable) => (
                      <span
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        key={variable}
                      >
                        {"{{"}
                        {variable}
                        {"}}"}
                      </span>
                    ))}
                  </div>

                  <label className={labelClass}>
                    Subject
                    <input className={inputClass} defaultValue={subject} name="subject" required />
                  </label>

                  <label className={labelClass}>
                    Text Body
                    <textarea
                      className={`${inputClass} min-h-44 font-mono text-xs leading-6`}
                      defaultValue={textBody}
                      name="textBody"
                      required
                    />
                  </label>

                  <div className={labelClass}>
                    <span>Optional HTML Body</span>
                    <RichContentEditor
                      help="Optional formatted version. Media uploads go to the Media Library."
                      initialHtml={htmlBody}
                      label="Rich HTML Body"
                      name="htmlBody"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input
                        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked={isActive}
                        name="isActive"
                        type="checkbox"
                      />
                      Active
                    </label>
                    <SubmitButton
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      pendingText="Saving template..."
                      showStatus={false}
                    >
                      <Save className="size-4" />
                      Save Template
                    </SubmitButton>
                  </div>
                </form>
              </article>
            );
          })}
        </section>

        {customTemplates.length > 0 ? (
          <section className="grid gap-4">
            <h3 className="text-base font-semibold text-slate-950">
              Custom Templates
            </h3>
            {customTemplates.map((template) => (
              <article
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                key={template.id}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {template.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          template.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {template.description ? (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {template.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-400">
                      Key: {template.key} - Updated: {formatDate(template.updatedAt)}
                    </p>
                  </div>
                </div>

                <form action={saveEmailTemplateAction} className="grid gap-3">
                  <input name="key" type="hidden" value={template.key} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className={labelClass}>
                      Name
                      <input className={inputClass} defaultValue={template.name} name="name" required />
                    </label>
                    <label className={labelClass}>
                      Description
                      <input
                        className={inputClass}
                        defaultValue={template.description ?? ""}
                        name="description"
                      />
                    </label>
                  </div>
                  <label className={labelClass}>
                    Subject
                    <input className={inputClass} defaultValue={template.subject} name="subject" required />
                  </label>
                  <label className={labelClass}>
                    Text Body
                    <textarea
                      className={`${inputClass} min-h-36 font-mono text-xs leading-6`}
                      defaultValue={template.textBody}
                      name="textBody"
                      required
                    />
                  </label>
                  <div className={labelClass}>
                    <span>Optional HTML Body</span>
                    <RichContentEditor
                      help="Optional formatted version. Media uploads go to the Media Library."
                      initialHtml={template.htmlBody ?? ""}
                      label="Rich HTML Body"
                      name="htmlBody"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input
                        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked={template.isActive}
                        name="isActive"
                        type="checkbox"
                      />
                      Active
                    </label>
                    <SubmitButton
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      pendingText="Saving template..."
                      showStatus={false}
                    >
                      <Save className="size-4" />
                      Save Custom Template
                    </SubmitButton>
                  </div>
                </form>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
