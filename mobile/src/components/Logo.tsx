import { Image, StyleSheet, View } from 'react-native';

/**
 * The official Wish2Care logo, from the brand package in assets/logo/.
 *
 * This replaced a hand-drawn SVG approximation of three rounded bars, which
 * was standing in while no source asset existed. The real mark is a teal "i"
 * beside two purple forms, and the supplied lockup stacks it above the
 * wordmark — so this is a stacked image, not the horizontal row the
 * approximation drew.
 *
 * Sizing is by height, with width derived from the artwork's own ratio. Give
 * it a height and it cannot be distorted.
 */

const LOCKUP_RATIO = 3840 / 1720; // supplied lockup artboard
const MARK_RATIO = 864 / 717; // mark on its own

const SOURCES = {
  color: require('../../assets/logo/wish2care-lockup-color.png'),
  white: require('../../assets/logo/wish2care-lockup-white.png'),
  mark: require('../../assets/logo/wish2care-mark.png'),
};

type LogoProps = {
  /** Rendered height in px. Width follows the artwork's aspect ratio. */
  height?: number;
  variant?: 'color' | 'white';
  /** false renders the mark alone, without the wordmark beneath it. */
  showWordmark?: boolean;
};

export function Logo({ height = 96, variant = 'color', showWordmark = true }: LogoProps) {
  const ratio = showWordmark ? LOCKUP_RATIO : MARK_RATIO;
  const source = showWordmark ? SOURCES[variant] : SOURCES.mark;

  return (
    <View style={styles.container}>
      <Image
        source={source}
        style={{ height, width: height * ratio }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Wish2Care"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
