import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulator: use 10.0.2.2 to reach your machine's localhost.
// Physical device: use your machine's LAN IP (e.g. http://192.168.1.23:3000/api) — localhost won't work.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');

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
      `Cannot reach the API server at ${API_URL}. Make sure the backend is running (npm run dev from the project root) and EXPO_PUBLIC_API_URL points to a host reachable from your device.`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) throw new Error('Network response was not ok');
    return null;
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}
