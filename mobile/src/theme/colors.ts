// From Wish2Care Brand Guidelines.
// Alabaster/Raisin Black are approximated from the swatch images — the source
// PDF has a copy-paste error where all four color hex labels read 622A7F.
export const colors = {
  eminence: '#622A7F', // primary purple
  pineGreen: '#067068', // secondary green
  alabaster: '#F0EDE4', // light background (approximated)
  raisinBlack: '#221F26', // dark text (approximated)
  white: '#FFFFFF',

  // Tokens pulled from the Figma design file (Wish2Care mobile app),
  // used on screens matched against it — e.g. DoctorAppointment.
  teal: '#0F766E',
  figmaTextPrimary: '#1A1A1A',
  figmaTextSecondary: '#5F6368',
  figmaPlaceholder: '#8A8F98',
  figmaBorder: '#E9E4ED',
  figmaBackdrop: 'rgba(18,23,38,0.45)',
  figmaSegmentBg: '#F3F3F3',
  figmaDivider: '#D0C2D1',
  statusGreenBg: '#F0FDF4',
  statusGreenBorder: '#BBF7D0',
  statusGreenDot: '#22C55E',
  statusGreenText: '#15803D',
  statusBlueBg: '#EFF6FF',
  statusBlueBorder: '#BFDBFE',
  statusBlueDot: '#3B82F6',
  statusBlueText: '#1D4ED8',
  statusNeutralBg: '#E5E7EB',
  statusNeutralText: '#535961',

  // Home / Health Passport screen tokens (Figma "Home" frame).
  figmaCardBg: '#FAFAF9',
  figmaCardBorder: '#F1F1F0',
  heroSubtext: '#FAFAFA',
  heroPanel: 'rgba(255,255,255,0.4)',
  heroBadgeBg: 'rgba(0,0,0,0.5)',
  iconCyan: '#06B6D4',
  iconBlue: '#2563EB',
  iconAmber: '#F59E0B',
  iconRed: '#DC2626',
  badgeGreen: '#1F7754',
  badgeOlive: '#5D7D0D',
  badgeTeal: '#41909B',

  // Report / Health Passport detail screen tokens (Figma "Reports" frame).
  reportTextPrimary: '#1F2937',
  reportTextSecondary: '#6B7280',
  reportBorder: '#E5E7EB',
  reportPillGreenBg: '#E6F2F0',
  reportPillGreenText: '#1A6B61',
} as const;
