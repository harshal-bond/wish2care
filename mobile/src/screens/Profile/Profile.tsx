import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';
import { FloatingNavBar } from '../../components/FloatingNavBar';
import type { RootStackParamList } from '../../navigation/types';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  fieldworker: 'Field Worker',
  admin: 'Admin',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: logout },
    ]);
  };

  const goHome = () => {
    if (user?.role === 'student') {
      navigation.navigate('StudentDetail', { studentId: user.id });
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user ? initials(user.name) : ''}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user ? (ROLE_LABELS[user.role] ?? user.role) : ''}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          {user?.email ? (
            <View style={styles.detailRow}>
              <Feather name="mail" size={16} color={colors.figmaTextSecondary} />
              <Text style={styles.detailText}>{user.email}</Text>
            </View>
          ) : null}
          {/* Students sign in with an email or a student code, not a phone
              number, so the code is what identifies them here. */}
          {user?.role === 'student' ? (
            <View style={styles.detailRow}>
              <Feather name="hash" size={16} color={colors.figmaTextSecondary} />
              <Text style={styles.detailText}>{user.studentCode}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Feather name="log-out" size={16} color={colors.teal} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <FloatingNavBar active="profile" onHomePress={goHome} onProfilePress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  avatarText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 28,
    color: colors.white,
  },
  info: {
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 20,
    color: colors.figmaTextPrimary,
  },
  roleBadge: {
    backgroundColor: colors.statusBlueBg,
    borderWidth: 1,
    borderColor: colors.statusBlueBorder,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  roleBadgeText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 12,
    color: colors.statusBlueText,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 8,
  },
  logoutText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.teal,
  },
});
