import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';

type CircleBackButtonProps = {
  canGoBack?: boolean;
};

// Matches the Figma "BackButton" — a circular outlined icon button, used as
// headerLeft in place of the native stack's default chevron+label back button.
//
// native-stack's headerLeft only passes { canGoBack, tintColor } — no onPress
// (unlike the older JS-based @react-navigation/stack) — so we call goBack()
// ourselves via useNavigation() rather than expecting one from props.
export function CircleBackButton({ canGoBack }: CircleBackButtonProps) {
  const navigation = useNavigation();
  if (!canGoBack) return null;
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.button}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Feather name="arrow-left" size={20} color={colors.figmaTextPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
