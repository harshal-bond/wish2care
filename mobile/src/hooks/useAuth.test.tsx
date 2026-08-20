import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './useAuth';
import { fetchApi } from '../lib/api';

jest.mock('../lib/api');
const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

const mockWorker = {
  id: 1,
  email: 'worker@wish2care.org',
  role: 'fieldworker' as const,
  name: 'Field Worker',
};

function renderUseAuth() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const clearSpy = jest.spyOn(queryClient, 'clear');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  const view = renderHook(() => useAuth(), { wrapper });
  return { ...view, clearSpy };
}

describe('useAuth', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockedFetchApi.mockReset();
  });

  it('finishes loading with no user when no token is stored', async () => {
    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockedFetchApi).not.toHaveBeenCalled();
  });

  it('restores the session when a stored token is still valid', async () => {
    await AsyncStorage.setItem('token', 'valid-token');
    mockedFetchApi.mockResolvedValue({ success: true, data: { worker: mockWorker } });

    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockWorker);
    expect(mockedFetchApi).toHaveBeenCalledWith('/auth/me');
  });

  it('clears the stored token when /auth/me fails', async () => {
    await AsyncStorage.setItem('token', 'stale-token');
    mockedFetchApi.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderUseAuth();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();
  });

  it('login persists the token and sets the user', async () => {
    const { result } = renderUseAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('new-token', mockWorker);
    });

    expect(result.current.user).toEqual(mockWorker);
    expect(await AsyncStorage.getItem('token')).toBe('new-token');
  });

  it('logout clears storage and the query cache', async () => {
    const { result, clearSpy } = renderUseAuth();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('token', mockWorker);
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(await AsyncStorage.getItem('token')).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
  });
});
