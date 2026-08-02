import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { HealthRecordPartial } from '@wish2care/shared';
import { fetchApi } from './api';

onlineManager.setEventListener((setOnline) => {
  try {
    return NetInfo.addEventListener((state) => setOnline(!!state.isConnected));
  } catch (error) {
    // NetInfo is a native module — this throws on a dev-client build that
    // predates adding the dependency. Degrade to "always online" (the same
    // behavior the app had before NetInfo existed) instead of crashing on
    // launch. Rebuild with: eas build --profile development --platform android
    console.warn('[queryClient] NetInfo native module unavailable — offline detection disabled until the dev client is rebuilt.', error);
    return () => {};
  }
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wish2care-mobile-query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24,
};

export const HEALTH_RECORD_SAVE_MUTATION_KEY = ['healthRecords', 'save'] as const;

export function saveHealthRecordMutationFn({
  studentId,
  payload,
}: {
  studentId: number;
  payload: HealthRecordPartial;
}) {
  return fetchApi(`/health-records/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Registered at app init (not inside a screen) so a mutation resumed from
// the persisted queue after an app restart — when no HealthRecordForm
// screen is mounted to supply one — can still find its mutationFn, since
// functions can't survive JSON persistence to AsyncStorage.
queryClient.setMutationDefaults(HEALTH_RECORD_SAVE_MUTATION_KEY, {
  mutationFn: saveHealthRecordMutationFn,
});
