import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

type SupportReplyTokenPayload = {
  requestId: string;
  email: string;
  exp: number;
};

function getTokenSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for support reply links.");
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", getTokenSecret())
    .update(payload)
    .digest("base64url");
}

export function createSupportReplyToken(input: {
  requestId: string;
  email: string;
  expiresInDays?: number;
}) {
  const expiresInDays = input.expiresInDays ?? 30;
  const payload: SupportReplyTokenPayload = {
    requestId: input.requestId,
    email: input.email.trim().toLowerCase(),
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };
  const encodedPayload = encode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySupportReplyToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SupportReplyTokenPayload;

    if (
      !payload.requestId ||
      !payload.email ||
      !payload.exp ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
