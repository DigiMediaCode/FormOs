import "server-only";

import { keepLarkMailSenderTokenFresh } from "@/lib/integrations/lark-mail/client";

const FIRST_CHECK_DELAY_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

let started = false;

async function runCheck() {
  try {
    await keepLarkMailSenderTokenFresh();
  } catch (error) {
    console.error("[formos:lark-mail] Lark Mail keepalive check failed.", {
      error: error instanceof Error ? error.message : "Unknown error.",
    });
  }
}

// Runs inside the long-lived server process (see instrumentation.ts). Timers are
// unref'd so they never keep a process alive on their own.
export function startLarkMailKeepalive() {
  if (started) {
    return;
  }

  started = true;
  setTimeout(runCheck, FIRST_CHECK_DELAY_MS).unref();
  setInterval(runCheck, CHECK_INTERVAL_MS).unref();
  console.info("[formos:lark-mail] Lark Mail token keepalive scheduled.");
}
