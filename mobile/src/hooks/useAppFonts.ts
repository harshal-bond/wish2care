import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light: require('../../assets/fonts/Poppins_300Light.ttf'),
    Poppins_400Regular: require('../../assets/fonts/Poppins_400Regular.ttf'),
    Poppins_500Medium: require('../../assets/fonts/Poppins_500Medium.ttf'),
    Poppins_700Bold: require('../../assets/fonts/Poppins_700Bold.ttf'),
  });

  return fontsLoaded;
}
