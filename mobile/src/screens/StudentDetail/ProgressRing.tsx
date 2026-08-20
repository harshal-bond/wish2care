import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

type ProgressRingProps = {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
};

export function ProgressRing({ progress, size = 88, strokeWidth = 8, children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.rotated}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.eminence + '20'} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.pineGreen}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: {
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
