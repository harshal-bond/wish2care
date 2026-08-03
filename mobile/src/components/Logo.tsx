import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

// Approximated from the Wish2Care Brand Guidelines PDF (no source SVG available yet).
// Three rounded bars of increasing height, standing in for the logomark's
// "i" + human-figure motif. Swap for the real asset when available.
function Logomark({ size = 32, variant = 'color' }: { size?: number; variant?: 'color' | 'white' }) {
  const barColor = variant === 'white' ? colors.white : colors.eminence;
  const accentColor = variant === 'white' ? colors.white : colors.pineGreen;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x="8" y="55" width="20" height="30" rx="10" fill={accentColor} />
      <Rect x="38" y="30" width="20" height="55" rx="10" fill={barColor} />
      <Rect x="68" y="15" width="20" height="70" rx="10" fill={barColor} />
    </Svg>
  );
}

type LogoProps = {
  size?: number;
  variant?: 'color' | 'white';
  showWordmark?: boolean;
};

export function Logo({ size = 32, variant = 'color', showWordmark = true }: LogoProps) {
  // Clear space: pad the whole lockup by ~1 char-width per the brand guideline.
  const clearSpace = size * 0.3;
  return (
    <View style={[styles.row, { padding: clearSpace }]}>
      <Logomark size={size} variant={variant} />
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize: size * 0.7, color: variant === 'white' ? colors.white : colors.eminence },
          ]}
        >
          W
          <Text style={{ color: variant === 'white' ? colors.white : colors.pineGreen }}>i</Text>
          sh2Care
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: fonts.bold,
  },
});
