export function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.88-1.73 2.99-4.28 2.99-7.52Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.61-2.41l-3.22-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.91a6 6 0 0 1 0-3.82V7.5H3.07a10 10 0 0 0 0 9l3.33-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.97c1.47 0 2.8.51 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2 10 10 0 0 0 3.07 7.5l3.33 2.59C7.19 7.73 9.4 5.97 12 5.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LarkLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <rect fill="#1F7AF8" height="10" rx="3" width="10" x="2" y="2" />
      <rect fill="#00C2A8" height="10" rx="3" width="10" x="12" y="2" />
      <rect fill="#7B61FF" height="10" rx="3" width="10" x="2" y="12" />
      <rect fill="#FFB020" height="10" rx="3" width="10" x="12" y="12" />
      <circle cx="12" cy="12" fill="white" r="3.2" />
    </svg>
  );
}
