import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { Student, HealthRecord } from '@wish2care/shared';
import { SCREENING_SECTIONS } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };

export function StudentReportScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'StudentReport'>>();
  const { studentId } = route.params;
  const {
    data: student,
    isLoading,
    error,
  } = useQuery<StudentWithRecord | null>({
    queryKey: ['students', studentId],
    queryFn: async () => (await fetchApi(`/students/${studentId}`))?.data ?? null,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.eminence} />
      </View>
    );
  }

  if (error || !student) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error?.message || 'Report not found.'}</Text>
      </View>
    );
  }

  const record = student.healthRecord;

  if (!record) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No screening data recorded yet for {student.name}.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {SCREENING_SECTIONS.map((section) => {
        const filledFields = section.fields.filter((f) => record[f.key] != null);
        if (filledFields.length === 0) return null;

        return (
          <View key={section.id} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            {filledFields.map((f) => (
              <View key={f.key} style={styles.row}>
                <Text style={styles.rowLabel}>{f.label}</Text>
                <Text style={styles.rowValue}>{String(record[f.key])}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.alabaster,
  },
  content: {
    padding: 24,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alabaster,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.raisinBlack + '90',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.raisinBlack,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.raisinBlack,
  },
});
