import Link from "next/link";
import { StorageProvider, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { GOOGLE_DRIVE_SCOPE, getGoogleDriveIntegrationStatus } from "@/lib/integrations/google-drive/client";
import { DROPBOX_SCOPE, getDropboxIntegrationStatus } from "@/lib/integrations/dropbox/client";
import { LARK_MAIL_SCOPE, getLarkMailIntegrationStatus } from "@/lib/integrations/lark-mail/client";
import { getUserUploadStorageStatus } from "@/lib/integrations/upload-settings";
import {
  clearDropboxUploadFolderAction,
  clearGoogleDriveUploadFolderAction,
  saveDropboxUploadFolderAction,
  saveGoogleDriveUploadFolderAction,
  setActiveUploadProviderAction,
} from "./actions";

type IntegrationsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { error, success } = await searchParams;
  const [googleDrive, dropbox, uploadStorage] = await Promise.all([
    getGoogleDriveIntegrationStatus(user.id),
    getDropboxIntegrationStatus(user.id),
    getUserUploadStorageStatus(user.id),
  ]);
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const larkMail = isSuperAdmin
    ? await getLarkMailIntegrationStatus(user.id)
    : null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard">
            Dashboard
          </Link>
          <p className="mt-3 text-sm font-medium uppercase tracking-wide text-teal-700">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Integrations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Connect external services used by your forms.
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

        {uploadStorage.needsExplicitSelection ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Choose an active upload storage provider before using image upload fields.
          </p>
        ) : null}

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">
                  Google Drive
                </h2>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    googleDrive.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {googleDrive.connected ? "Connected" : "Not connected"}
                </span>
                {uploadStorage.activeProvider === StorageProvider.GOOGLE_DRIVE ? (
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                    Active uploads
                  </span>
                ) : null}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Files uploaded through your forms can be saved to your Google
                Drive instead of FormOS storage.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Requested scope: {GOOGLE_DRIVE_SCOPE}
              </p>
              {googleDrive.connected ? (
                <p className="mt-3 text-xs text-slate-500">
                  Connected {formatDate(googleDrive.connectedAt) ?? "recently"}.
                </p>
              ) : null}
            </div>

            {googleDrive.connected ? (
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <form action={setActiveUploadProviderAction}>
                  <input name="provider" type="hidden" value={StorageProvider.GOOGLE_DRIVE} />
                  <button
                    className="rounded-md border border-teal-700 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={uploadStorage.activeProvider === StorageProvider.GOOGLE_DRIVE}
                    type="submit"
                  >
                    Set as Active
                  </button>
                </form>
                <form action="/api/integrations/google-drive/disconnect" method="post">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    type="submit"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <Link
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/api/integrations/google-drive/connect"
              >
                Connect
              </Link>
            )}
          </div>

          {googleDrive.connected ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-slate-950">
                Upload folder
              </h3>
              {googleDrive.uploadFolder ? (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-950">
                    {googleDrive.uploadFolder.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-600">
                    Folder ID: {googleDrive.uploadFolder.id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Configured {formatDate(new Date(googleDrive.uploadFolder.configuredAt)) ?? "recently"}.
                  </p>
                </div>
              ) : (
                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  No custom upload folder is configured. Uploads will use or create
                  a default FormOS Uploads folder in your Google Drive.
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <form action={saveGoogleDriveUploadFolderAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                    Google Drive Folder URL or Folder ID
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      name="folderInput"
                      placeholder="https://drive.google.com/drive/folders/..."
                      type="text"
                    />
                  </label>
                  <button
                    className="self-end rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    type="submit"
                  >
                    Save Upload Folder
                  </button>
                </form>

                <form action={clearGoogleDriveUploadFolderAction} className="sm:self-end">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!googleDrive.uploadFolder}
                    type="submit"
                  >
                    Clear Upload Folder
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">
                  Dropbox
                </h2>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    dropbox.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {dropbox.connected ? "Connected" : "Not connected"}
                </span>
                {uploadStorage.activeProvider === StorageProvider.DROPBOX ? (
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                    Active uploads
                  </span>
                ) : null}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Files uploaded through your forms can be saved to a folder path
                in your connected Dropbox account.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Requested scope: {DROPBOX_SCOPE}
              </p>
              {dropbox.connected ? (
                <p className="mt-3 text-xs text-slate-500">
                  Connected {formatDate(dropbox.connectedAt) ?? "recently"}.
                </p>
              ) : null}
            </div>

            {dropbox.connected ? (
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <form action={setActiveUploadProviderAction}>
                  <input name="provider" type="hidden" value={StorageProvider.DROPBOX} />
                  <button
                    className="rounded-md border border-teal-700 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={uploadStorage.activeProvider === StorageProvider.DROPBOX}
                    type="submit"
                  >
                    Set as Active
                  </button>
                </form>
                <form action="/api/integrations/dropbox/disconnect" method="post">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    type="submit"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <Link
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/api/integrations/dropbox/connect"
              >
                Connect
              </Link>
            )}
          </div>

          {dropbox.connected ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-base font-semibold text-slate-950">
                Upload folder path
              </h3>
              {dropbox.uploadFolder ? (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="break-all text-sm font-medium text-slate-950">
                    {dropbox.uploadFolder.path}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Configured {formatDate(new Date(dropbox.uploadFolder.configuredAt)) ?? "recently"}.
                  </p>
                </div>
              ) : (
                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  No custom Dropbox path is configured. Uploads will use
                  /FormOS Uploads.
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <form action={saveDropboxUploadFolderAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                    Dropbox parent folder path
                    <input
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      name="folderPath"
                      placeholder="/FormOS Uploads"
                      type="text"
                    />
                  </label>
                  <button
                    className="self-end rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    type="submit"
                  >
                    Save Dropbox Path
                  </button>
                </form>

                <form action={clearDropboxUploadFolderAction} className="sm:self-end">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!dropbox.uploadFolder}
                    type="submit"
                  >
                    Clear Dropbox Path
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </section>

        {larkMail ? (
          <section className="rounded-md border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Lark Mail
                  </h2>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                      larkMail.connected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {larkMail.connected ? "Connected" : "Not connected"}
                  </span>
                  <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
                    Super Admin
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                  FormOS uses Lark Mail to send signup, login, submission, and
                  completion notifications from your configured sender mailbox.
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Sender mailbox: {larkMail.senderEmail ?? "Not configured"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Requested scope: {LARK_MAIL_SCOPE}
                </p>
                {larkMail.connected ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Connected {formatDate(larkMail.connectedAt) ?? "recently"}.
                  </p>
                ) : (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800">
                    Lark Mail requires the sender mailbox to authorize FormOS.
                    App tenant tokens cannot send user mailbox email.
                  </p>
                )}
              </div>

              {larkMail.connected ? (
                <form action="/api/integrations/lark-mail/disconnect" method="post">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    type="submit"
                  >
                    Disconnect
                  </button>
                </form>
              ) : (
                <Link
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  href="/api/integrations/lark-mail/connect"
                >
                  Connect
                </Link>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
