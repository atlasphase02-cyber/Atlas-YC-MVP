/**
 * Server-side environment variable validation.
 *
 * Import from server-only modules (server functions, server routes).
 * Never import from browser code — reads `process.env`.
 *
 * Call `assertServerEnv()` at the top of a handler to fail fast with
 * a clear message when a required secret is missing in production.
 */

type RequiredEnv =
  | "SUPABASE_URL"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "LOVABLE_API_KEY";

const REQUIRED: RequiredEnv[] = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "LOVABLE_API_KEY",
];

export function assertServerEnv(extra: string[] = []): void {
  const missing = [...REQUIRED, ...extra].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variable(s): ${missing.join(", ")}. ` +
        `Configure them via Lovable Cloud secrets before deploying.`,
    );
  }
}

export function getServerEnv<K extends string>(key: K): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return v;
}
