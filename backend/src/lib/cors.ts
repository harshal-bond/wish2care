/** Normalize origin for comparison (no trailing slash). */
export function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

const DEFAULT_ORIGINS = [
  'https://app.wish2care.in',
  'https://wish2care-frontend.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/** Any Vercel deployment (production, preview, branch URLs). */
const VERCEL_ORIGIN = /^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/;

/** Local dev servers (Vite, etc.). */
const LOCAL_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function buildAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => normalizeOrigin(o.trim()))
    .filter(Boolean);

  // Merge env + defaults — env adds to defaults, never replaces them
  return [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);

  if (buildAllowedOrigins().includes(normalized)) return true;
  if (VERCEL_ORIGIN.test(normalized)) return true;
  if (LOCAL_DEV_ORIGIN.test(normalized)) return true;

  // Optional: single frontend URL shortcut on Railway
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (frontendUrl && normalized === normalizeOrigin(frontendUrl)) return true;

  return false;
}

export function corsOriginHeader(origin: string | undefined): string | null {
  if (!origin) return null;
  return isAllowedOrigin(origin) ? origin : null;
}
