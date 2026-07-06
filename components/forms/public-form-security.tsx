import {
  createFormTimestampToken,
  SPAM_HONEYPOT_FIELD,
  SPAM_TIMESTAMP_FIELD,
} from "@/lib/forms/spam-protection";
import { TurnstileWidget } from "@/components/forms/turnstile-widget";

type PublicFormSecurityProps = {
  formId: string;
  turnstile: {
    turnstileEnabled: boolean;
    turnstileSiteKey: string;
  };
};

/**
 * Injects the invisible anti-spam controls (honeypot + signed time-trap token)
 * into a public/embedded form, plus the Cloudflare Turnstile widget when the
 * platform has it configured. Rendered as a child of the public form so all
 * fields post together in the same FormData.
 */
export function PublicFormSecurity({
  formId,
  turnstile,
}: PublicFormSecurityProps) {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Leave this field empty
          <input
            autoComplete="off"
            defaultValue=""
            name={SPAM_HONEYPOT_FIELD}
            tabIndex={-1}
            type="text"
          />
        </label>
      </div>

      <input
        defaultValue={createFormTimestampToken(formId)}
        name={SPAM_TIMESTAMP_FIELD}
        type="hidden"
      />

      {turnstile.turnstileEnabled && turnstile.turnstileSiteKey ? (
        <div className="flex justify-center">
          <TurnstileWidget siteKey={turnstile.turnstileSiteKey} />
        </div>
      ) : null}
    </>
  );
}
