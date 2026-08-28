export const API_URL = import.meta.env.VITE_API_URL || '/api';

const FETCH_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function networkErrorMessage(endpoint: string, cause?: unknown): string {
  const target = `${API_URL}${endpoint}`;
  const isLocal = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
  const timedOut = cause instanceof DOMException && cause.name === 'AbortError';

  if (timedOut) {
    return `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s calling ${target}. The server may be waking up (Railway cold start) or the network is slow — wait a moment and try again.`;
  }
  if (isLocal) {
    return `Cannot reach the API at ${target}. Other users cannot use localhost — set VITE_API_URL on Vercel to your public Railway API URL (https://…), then redeploy the frontend.`;
  }
  return `Cannot reach the API at ${target}. If other devices on the same Wi‑Fi work, this device may have a stale cached app — hard-refresh or clear site data. Also confirm Railway backend is up and CORS allows ${window.location.origin}.`;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(800 * attempt);
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) continue;
      throw new Error(networkErrorMessage(endpoint, err));
    }

    // Handle blob responses (like Excel export)
    if (response.headers.get('Content-Type')?.includes('spreadsheetml')) {
      if (!response.ok) {
        throw new Error('Export failed');
      }
      return response.blob();
    }

    let data;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) throw new Error('Network response was not ok');
      return null;
    }

    if (!response.ok) {
      // DB / server errors — not "cannot reach server"
      if (response.status === 503) {
        throw new Error(
          data.error ||
            'Server database is temporarily unavailable. Retry in a few seconds.'
        );
      }
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  }

  throw new Error(networkErrorMessage(endpoint, lastError));
}
