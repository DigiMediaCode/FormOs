import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

type OAuthStatePayload = {
  userId: string;
  nonce: string;
  expiresAt: number;
};

function getStateSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "formos-development-auth-secret";
}

function sign(value: string) {
  return createHmac("sha256", getStateSecret()).update(value).digest("base64url");
}

export function createDropboxOAuthState(userId: string) {
  const payload: OAuthStatePayload = {
    userId,
    nonce: randomBytes(16).toString("base64url"),
    expiresAt: Date.now() + STATE_MAX_AGE_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readDropboxOAuthState(state: string) {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as OAuthStatePayload;

    if (!payload.userId || !payload.nonce || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
