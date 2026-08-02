import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import type { Student } from '@wish2care/shared';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

type StudentWithStatus = Student & {
  _status: { completedDomains: number; isComplete: boolean };
};

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<HomeNavigationProp>();
  const {
    data: students = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<StudentWithStatus[]>({
    queryKey: ['students'],
    queryFn: async () => (await fetchApi('/students'))?.data ?? [],
  });

  // All students in this list share the same school — the backend already
  // scopes a fieldworker to one assigned school (see workers.assignedSchoolId).
  const schoolName = students[0]?.school?.name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Students</Text>
          {schoolName ? <Text style={styles.schoolName}>{schoolName}</Text> : null}
        </View>
        <Button title="Log Out" onPress={logout} />
      </View>

      {error ? <Text style={styles.error}>{error.message || 'Failed to load students.'}</Text> : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.eminence} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.eminence} />}
          ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('StudentDetail', { studentId: item.id, schoolName: item.school?.name })}
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.code}>{item.studentCode}</Text>
              </View>
              <View style={[styles.badge, item._status.isComplete ? styles.badgeComplete : styles.badgePending]}>
                <Text style={[styles.badgeText, item._status.isComplete ? styles.badgeTextComplete : styles.badgeTextPending]}>
                  {item._status.isComplete ? 'Complete' : `${item._status.completedDomains}/8`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.alabaster,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.eminence,
  },
  schoolName: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#B3261E',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
    flexGrow: 1,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.raisinBlack,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardInfo: {
    gap: 2,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.raisinBlack,
  },
  code: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeComplete: {
    backgroundColor: colors.pineGreen + '20',
  },
  badgePending: {
    backgroundColor: colors.eminence + '15',
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  badgeTextComplete: {
    color: colors.pineGreen,
  },
  badgeTextPending: {
    color: colors.eminence,
  },
});
