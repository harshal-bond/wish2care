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
    throw new Error(
      'Cannot reach the API server. Start the backend with `npm run dev` from the project root.'
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
