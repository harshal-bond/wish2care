import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { Student, HealthRecord } from '@wish2care/shared';
import { CLASSIFICATION } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };

type DomainField = { key: keyof HealthRecord; label: string };
type Domain = {
  title: string;
  classField?: keyof HealthRecord;
  fields: DomainField[];
};

// Classification is only ever stored for these 5 domains — the other 3
// (Vision, Oral Health, Respiratory) are "classification auto-computed by
// Excel" per backend/src/db/schema.ts, meaning the DB only has raw inputs.
const DOMAINS: Domain[] = [
  {
    title: 'Undernutrition',
    classField: 'undernutritionClass',
    fields: [
      { key: 'height', label: 'Height (cm)' },
      { key: 'weight', label: 'Weight (kg)' },
    ],
  },
  { title: 'Overweight / Obesity', classField: 'overweightClass', fields: [] },
  {
    title: 'Anaemia',
    classField: 'anaemiaClass',
    fields: [{ key: 'hb', label: 'Hb (g/dL)' }],
  },
  {
    title: 'Blood Pressure',
    classField: 'bpClass',
    fields: [
      { key: 'systolic', label: 'Systolic' },
      { key: 'diastolic', label: 'Diastolic' },
    ],
  },
  {
    title: 'Metabolic Risk',
    classField: 'metabolicRiskClass',
    fields: [
      { key: 'waistCircumference', label: 'Waist Circumference (cm)' },
      { key: 'familyHxCount', label: 'Family History Count' },
    ],
  },
  {
    title: 'Vision',
    fields: [
      { key: 'rightEyeAcuity', label: 'Right Eye Acuity' },
      { key: 'leftEyeAcuity', label: 'Left Eye Acuity' },
    ],
  },
  {
    title: 'Oral Health',
    fields: [{ key: 'decayedTeethCount', label: 'Decayed Teeth Count' }],
  },
  {
    title: 'Respiratory',
    fields: [
      { key: 'wheezeSymptom', label: 'Wheeze Symptom' },
      { key: 'measuredPefr', label: 'Measured PEFR' },
      { key: 'predictedPefr', label: 'Predicted PEFR' },
    ],
  },
];

const TB_FIELDS: DomainField[] = [
  { key: 'tbCough', label: 'Cough' },
  { key: 'tbFever', label: 'Fever' },
  { key: 'tbNightSweats', label: 'Night Sweats' },
  { key: 'tbWeightLoss', label: 'Weight Loss' },
];

function classificationColor(value: string | null | undefined) {
  if (value === CLASSIFICATION.NORMAL) return colors.pineGreen;
  if (value === CLASSIFICATION.CAUTION) return '#B26A00';
  if (value === CLASSIFICATION.HIGH_RISK) return '#B3261E';
  return colors.raisinBlack + '60';
}

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

  const hasTbData = TB_FIELDS.some((f) => record[f.key] != null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {DOMAINS.map((domain) => {
        const classValue = domain.classField ? (record[domain.classField] as string | null) : null;
        const filledFields = domain.fields.filter((f) => record[f.key] != null);
        if (!classValue && filledFields.length === 0) return null;

        return (
          <View key={domain.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{domain.title}</Text>
              {classValue ? (
                <View style={[styles.badge, { backgroundColor: classificationColor(classValue) + '18' }]}>
                  <Text style={[styles.badgeText, { color: classificationColor(classValue) }]}>{classValue}</Text>
                </View>
              ) : null}
            </View>
            {filledFields.map((f) => (
              <View key={f.key} style={styles.row}>
                <Text style={styles.rowLabel}>{f.label}</Text>
                <Text style={styles.rowValue}>{String(record[f.key])}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {hasTbData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TB Screen</Text>
          {TB_FIELDS.filter((f) => record[f.key] != null).map((f) => (
            <View key={f.key} style={styles.row}>
              <Text style={styles.rowLabel}>{f.label}</Text>
              <Text style={styles.rowValue}>{String(record[f.key])}</Text>
            </View>
          ))}
        </View>
      )}

      {record.mentalWellbeingResult ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mental Wellbeing</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: (record.mentalWellbeingResult === 'Clear' ? colors.pineGreen : '#B3261E') + '18' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: record.mentalWellbeingResult === 'Clear' ? colors.pineGreen : '#B3261E' },
                ]}
              >
                {record.mentalWellbeingResult}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
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
