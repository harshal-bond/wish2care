import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
import { inter } from '../theme/typography';

// Simplified version of the Figma "floating-navigation" component — the
// design has 5 tabs (Home/Benefits/Health/Claims/Perks), but only Home and
// Profile are real destinations in this app so far.
type Tab = 'home' | 'profile';

type FloatingNavBarProps = {
  active: Tab;
  onHomePress: () => void;
  onProfilePress: () => void;
};

export function FloatingNavBar({ active, onHomePress, onProfilePress }: FloatingNavBarProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        <NavTab icon="home" label="Home" active={active === 'home'} onPress={onHomePress} />
        <NavTab icon="user" label="Profile" active={active === 'profile'} onPress={onProfilePress} />
      </View>
    </View>
  );
}

type NavTabProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function NavTab({ icon, label, active, onPress }: NavTabProps) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Feather name={icon} size={20} color={active ? colors.teal : colors.figmaTextSecondary} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 24,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.figmaCardBg,
    borderRadius: 28,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: inter.semiBold,
    fontSize: 11,
    color: colors.figmaTextSecondary,
  },
  labelActive: {
    color: colors.teal,
  },
});
