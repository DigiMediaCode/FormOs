import Link from "next/link";
import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type AcceptInvitePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function MessageCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-xl rounded-md border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <div className="mt-4 text-sm leading-6 text-slate-700">{children}</div>
      </div>
    </main>
  );
}

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <MessageCard title="Invite unavailable">
        This invite link is missing a token.
      </MessageCard>
    );
  }

  const invite = await prisma.workspaceInvite.findFirst({
    where: {
      tokenHash: hashInviteToken(token),
    },
    select: {
      id: true,
      email: true,
      role: true,
      acceptedAt: true,
      expiresAt: true,
      workspaceId: true,
      invitedBy: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() <= Date.now()) {
    return (
      <MessageCard title="Invite unavailable">
        This invite is invalid, expired, or has already been accepted.
      </MessageCard>
    );
  }

  const invitedUser = await prisma.user.findUnique({
    where: {
      email: invite.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!invitedUser) {
    return (
      <MessageCard title="Create your FormOS account">
        <p>
          Please create an account with {invite.email} to accept this workspace
          invite.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/signup"
        >
          Create Account
        </Link>
      </MessageCard>
    );
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <MessageCard title="Log in to accept invite">
        <p>
          Log in with {invite.email} to join {invite.workspace.name || "this workspace"}.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/login"
        >
          Log In
        </Link>
      </MessageCard>
    );
  }

  if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <MessageCard title="Wrong account">
        This invite was sent to {invite.email}. Please log in with that email
        address to accept it.
      </MessageCard>
    );
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: currentUser.id,
      },
    },
    create: {
      workspaceId: invite.workspaceId,
      userId: currentUser.id,
      role: invite.role,
      status: "ACTIVE",
      invitedEmail: invite.email,
      invitedBy: invite.invitedBy,
    },
    update: {
      role: invite.role,
      status: "ACTIVE",
      invitedEmail: invite.email,
      invitedBy: invite.invitedBy,
    },
  });

  await prisma.workspaceInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      acceptedAt: new Date(),
    },
  });

  redirect("/dashboard?success=Team invite accepted.");
}
