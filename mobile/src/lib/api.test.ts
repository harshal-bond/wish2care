import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchApi } from './api';

describe('fetchApi', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (global as any).fetch = jest.fn();
  });

  it('throws a network-unreachable error when fetch itself rejects', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(fetchApi('/students')).rejects.toThrow('Cannot reach the API server');
  });

  it('throws the server error message on a non-ok HTTP response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Invalid credentials' }),
    });

    await expect(fetchApi('/auth/login', { method: 'POST' })).rejects.toThrow('Invalid credentials');
  });

  it('returns parsed JSON on a successful response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    await expect(fetchApi('/students')).resolves.toEqual({ success: true, data: [] });
  });

  it('attaches the Authorization header when a token is stored', async () => {
    await AsyncStorage.setItem('token', 'abc123');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await fetchApi('/students');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect((options.headers as Headers).get('Authorization')).toBe('Bearer abc123');
  });

  it('omits the Authorization header when no token is stored', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await fetchApi('/students');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect((options.headers as Headers).has('Authorization')).toBe(false);
  });
});
