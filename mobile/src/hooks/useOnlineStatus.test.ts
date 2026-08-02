import { act, renderHook } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it('reflects onlineManager going offline and back online', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);

    act(() => {
      onlineManager.setOnline(false);
    });
    expect(result.current).toBe(false);

    act(() => {
      onlineManager.setOnline(true);
    });
    expect(result.current).toBe(true);
  });
});
