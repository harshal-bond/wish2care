import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { HealthRecord, Student } from '@wish2care/shared';
import { SCREENING_SECTIONS } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { dmSans, hankenGrotesk } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };

// Figma shows "A" on both the Anthropometry and the Blood Pressure & RBS
// card badges (they're sub-parts of the same domain), everything else is 1:1
// with the section id.
const SECTION_BADGE_LETTER: Record<string, string> = {
  A: 'A',
  BP: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
};

// Anthropometry and Blood Pressure & RBS render as a 2-column metric grid in
// Figma; every other section is a list of key-value rows with a status pill.
const METRIC_SECTIONS = new Set(['A', 'BP']);

const METRIC_UNITS: Partial<Record<keyof HealthRecord, string>> = {
  height: 'cm',
  weight: 'kg',
  muac: 'cm',
  waistCircumference: 'cm',
  randomBloodSugar: 'mg/dL',
  // systolic/diastolic intentionally have no unit shown, matching Figma.
};

// The metric grid is too narrow for the full form labels ("Waist
// Circumference", "Random Blood Sugar") — Figma abbreviates them here even
// though the full label is used elsewhere (e.g. the health record form).
const METRIC_LABEL_OVERRIDES: Partial<Record<keyof HealthRecord, string>> = {
  waistCircumference: 'Waist',
  randomBloodSugar: 'RBS',
};

// The Figma mockup colors "limiting/negative" wording (No, Never, N/A, Less
// than...) gray and everything else green — this isn't the record's real 0-5
// clinical score (e.g. "Never" is the best possible answer for Junk Food,
// but Figma still renders it gray), just a wording heuristic to match the design.
function isNegativeWording(value: string): boolean {
  return value === 'No' || value === 'N/A' || value.startsWith('Never') || value.startsWith('Less than');
}

function SectionCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.letterBadge}>
          <Text style={styles.letterBadgeText}>{SECTION_BADGE_LETTER[id] ?? id}</Text>
        </View>
        <Text style={styles.cardTitle}>{title.replace(/^[A-Z]+ — /, '')}</Text>
      </View>
      {children}
    </View>
  );
}

type MetricCellProps = {
  label: string;
  value: number;
  unit?: string;
  labelColor?: string;
};

function MetricCell({ label, value, unit, labelColor = colors.reportTextSecondary }: MetricCellProps) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit ? <Text style={[styles.metricUnit, { color: labelColor }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function StatusPill({ value }: { value: string }) {
  const negative = isNegativeWording(value);
  return (
    <View style={[styles.statusPill, negative ? styles.statusPillNeutral : styles.statusPillGreen]}>
      <Text style={[styles.statusPillText, negative ? styles.statusPillTextNeutral : styles.statusPillTextGreen]}>
        {value}
      </Text>
    </View>
  );
}

function ClassCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricLabel, { color: colors.reportTextSecondary }]}>{label}</Text>
      <StatusPill value={value} />
    </View>
  );
}

function KeyValueRow({ label, value, showDivider }: { label: string; value: string; showDivider: boolean }) {
  return (
    <View>
      <View style={styles.keyValueRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        <StatusPill value={value} />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
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
        <ActivityIndicator color={colors.teal} />
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
      <Text style={styles.subtitle}>Here is your detailed health report</Text>

      {SCREENING_SECTIONS.map((section) => {
        const filledFields = section.fields.filter((f) => record[f.key] != null);
        if (filledFields.length === 0) return null;

        if (METRIC_SECTIONS.has(section.id)) {
          return (
            <SectionCard key={section.id} id={section.id} title={section.title}>
              <View style={styles.metricGrid}>
                {filledFields.map((f) => {
                  const value = record[f.key];
                  if (f.key === 'bpClass') {
                    return <ClassCell key={f.key} label={f.label} value={String(value)} />;
                  }
                  return (
                    <MetricCell
                      key={f.key}
                      label={METRIC_LABEL_OVERRIDES[f.key] ?? f.label}
                      value={value as number}
                      unit={METRIC_UNITS[f.key]}
                      labelColor={section.id === 'A' ? colors.teal : colors.reportTextSecondary}
                    />
                  );
                })}
              </View>
            </SectionCard>
          );
        }

        return (
          <SectionCard key={section.id} id={section.id} title={section.title}>
            {filledFields.map((f, i) => (
              <KeyValueRow
                key={f.key}
                label={f.label}
                value={String(record[f.key])}
                showDivider={i < filledFields.length - 1}
              />
            ))}
          </SectionCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  error: {
    fontFamily: dmSans.regular,
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    fontFamily: dmSans.regular,
    fontSize: 14,
    color: colors.reportTextSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.reportBorder,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  letterBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadgeText: {
    fontFamily: dmSans.bold,
    fontSize: 12,
    color: colors.white,
  },
  cardTitle: {
    fontFamily: dmSans.semiBold,
    fontSize: 15,
    color: colors.reportTextPrimary,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCell: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.reportBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontFamily: dmSans.regular,
    fontSize: 13,
    flexShrink: 1,
    marginRight: 6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    flexShrink: 0,
  },
  metricValue: {
    fontFamily: dmSans.semiBold,
    fontSize: 14,
    color: colors.reportTextPrimary,
  },
  metricUnit: {
    fontFamily: dmSans.medium,
    fontSize: 11,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  statusPillGreen: {
    backgroundColor: colors.reportPillGreenBg,
  },
  statusPillNeutral: {
    backgroundColor: colors.statusNeutralBg,
  },
  statusPillText: {
    fontFamily: dmSans.semiBold,
    fontSize: 13,
  },
  statusPillTextGreen: {
    color: colors.reportPillGreenText,
  },
  statusPillTextNeutral: {
    color: colors.statusNeutralText,
  },
  keyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: dmSans.regular,
    fontSize: 13,
    color: colors.reportTextSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.reportBorder,
  },
});
