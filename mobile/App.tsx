import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider } from './src/hooks/useAuth';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAppFonts } from './src/hooks/useAppFonts';
import { queryClient, persistOptions } from './src/lib/queryClient';

SplashScreen.preventAutoHideAsync();

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

export default function App() {
  const fontsLoaded = useAppFonts();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={() => {
          queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
        }}
      >
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </PersistQueryClientProvider>
    </View>
  );
}
