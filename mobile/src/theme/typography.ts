// Poppins per the Wish2Care Brand Guidelines. Font families are registered
// via useFonts() in src/hooks/useAppFonts.ts, loaded from local .ttf files
// in assets/fonts/.
export const fonts = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  bold: 'Poppins_700Bold',
} as const;

// Hanken Grotesk, used for screens matched against the Figma design file
// (e.g. DoctorAppointment). Loaded via @expo-google-fonts/hanken-grotesk.
export const hankenGrotesk = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semiBold: 'HankenGrotesk_600SemiBold',
} as const;

// Lora (headline serif) + Inter + Roboto — used on the Home/Health Passport
// screen per the Figma file. Loaded via their respective @expo-google-fonts packages.
export const lora = {
  bold: 'Lora_700Bold',
} as const;

export const inter = {
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
} as const;

export const roboto = {
  medium: 'Roboto_500Medium',
} as const;

// DM Sans — used on the Report / Health Passport detail screen per the
// Figma file. Loaded via @expo-google-fonts/dm-sans.
export const dmSans = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;
