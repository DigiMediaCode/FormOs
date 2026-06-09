import { NextResponse } from "next/server";
import { FormStatus } from "@prisma/client";
import { getAppUrl } from "@/lib/app-url";
import { authenticateApiToken } from "@/lib/api-tokens";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

function unauthorized() {
  return jsonResponse({ error: "Invalid or revoked API token." }, { status: 401 });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token;
}

function normalizeStatus(value: string | null) {
  if (!value) {
    return FormStatus.PUBLISHED;
  }

  const upper = value.toUpperCase();
  return upper in FormStatus ? (upper as FormStatus) : null;
}

export async function GET(request: Request) {
  const token = readBearerToken(request);
  const authenticated = token ? await authenticateApiToken(token) : null;

  if (!authenticated) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const status = normalizeStatus(url.searchParams.get("status"));

  if (!status) {
    return jsonResponse(
      { error: "Invalid status filter." },
      { status: 400 },
    );
  }

  const appUrl = getAppUrl();
  const forms = await prisma.form.findMany({
    where: {
      ownerId: authenticated.userId,
      status,
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      mode: true,
      updatedAt: true,
    },
  });

  return jsonResponse({
    data: forms.map((form) => ({
      id: form.id,
      title: form.title,
      status: form.status,
      mode: form.mode,
      updatedAt: form.updatedAt.toISOString(),
      embedUrl: `${appUrl}/embed/forms/${form.id}`,
    })),
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
