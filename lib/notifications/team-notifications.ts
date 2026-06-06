import "server-only";

import { sendEmail } from "@/lib/email/send-email";
import { renderEmailTemplate } from "@/lib/email/templates";

export async function sendWorkspaceInviteNotification(input: {
  to: string;
  workspaceName: string;
  inviteUrl: string;
}) {
  const email = await renderEmailTemplate({
    key: "workspace_invite",
    variables: {
      workspaceName: input.workspaceName,
      inviteUrl: input.inviteUrl,
    },
    fallback: {
      subject: "You have been invited to FormOS",
      text: [
        `You have been invited to join ${input.workspaceName} on FormOS.`,
        "",
        "Accept Invite:",
        input.inviteUrl,
        "",
        "This invite expires in 7 days.",
      ].join("\n"),
      html: `
        <p>You have been invited to join <strong>${input.workspaceName}</strong> on FormOS.</p>
        <p><a href="${input.inviteUrl}">Accept Invite</a></p>
        <p>This invite expires in 7 days.</p>
      `,
    },
  });

  return sendEmail({
    to: input.to,
    ...email,
  });
}
