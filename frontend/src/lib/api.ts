export const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    const target = `${API_URL}${endpoint}`;
    const isLocal =
      API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    throw new Error(
      isLocal
        ? `Cannot reach the API at ${target}. Other users cannot use localhost — set VITE_API_URL on Vercel to your public Railway API URL (https://…), then redeploy the frontend.`
        : `Cannot reach the API at ${target}. Check that the Railway backend is running and CORS allows this site's origin.`
    );
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
  } catch (e) {
    if (!response.ok) throw new Error('Network response was not ok');
    return null;
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}
