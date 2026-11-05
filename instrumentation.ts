// Next.js calls register() once when the server process starts.
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { startLarkMailKeepalive } = await import(
    "@/lib/integrations/lark-mail/keepalive"
  );
  startLarkMailKeepalive();
}
