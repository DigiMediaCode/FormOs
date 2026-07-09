import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createTemplateFormForOwner } from "@/lib/forms/templates/apply-template";

function safeSlug(value: string | null) {
  const slug = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}

/**
 * One-click "use this template" for logged-in users: creates the Draft form and
 * sends them to the Forms page. Anonymous users are sent to the template page to
 * start a trial instead.
 */
export async function GET(request: NextRequest) {
  const slug = safeSlug(request.nextUrl.searchParams.get("slug"));
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(
      getAppRedirectUrl(slug ? `/templates/${slug}` : "/templates"),
      { status: 303 },
    );
  }

  if (!slug) {
    return NextResponse.redirect(getAppRedirectUrl("/dashboard/forms/new"), {
      status: 303,
    });
  }

  const result = await createTemplateFormForOwner({
    ownerId: user.id,
    templateSlug: slug,
  });

  if (result.ok) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        `/dashboard/forms?success=${encodeURIComponent("Your template is ready in Drafts.")}`,
      ),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/forms/new?template=${encodeURIComponent(slug)}&error=${encodeURIComponent(result.reason)}`,
    ),
    { status: 303 },
  );
}
