import { useFonts } from 'expo-font';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Lora_700Bold } from '@expo-google-fonts/lora';
import { Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light: require('../../assets/fonts/Poppins_300Light.ttf'),
    Poppins_400Regular: require('../../assets/fonts/Poppins_400Regular.ttf'),
    Poppins_500Medium: require('../../assets/fonts/Poppins_500Medium.ttf'),
    Poppins_700Bold: require('../../assets/fonts/Poppins_700Bold.ttf'),
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    Lora_700Bold,
    Inter_500Medium,
    Inter_600SemiBold,
    Roboto_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  return fontsLoaded;
}
