import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { HealthRecord, HealthRecordPartial, Student } from '@wish2care/shared';
import { healthRecordPartialSchema } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../../components/Button';
import type { RootStackParamList } from '../../navigation/types';
import { HEALTH_RECORD_DOMAINS } from './fieldsConfig';
import { DomainSection } from './DomainSection';
import { SaveStatus } from './SaveStatus';
import { useSaveHealthRecord } from './useSaveHealthRecord';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };

export function HealthRecordFormScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'HealthRecordForm'>>();
  const { studentId } = route.params;

  const {
    data: student,
    isLoading,
    error,
  } = useQuery<StudentWithRecord | null>({
    queryKey: ['students', studentId],
    queryFn: async () => (await fetchApi(`/students/${studentId}`))?.data ?? null,
  });

  const form = useForm<HealthRecordPartial>({
    // healthRecordPartialSchema's optional enum fields use z.transform(), so the
    // resolver's inferred input/output types don't line up with HealthRecordPartial
    // (z.output) exactly — the cast is safe since zodResolver handles the transform
    // correctly at runtime regardless.
    resolver: zodResolver(healthRecordPartialSchema) as unknown as Resolver<HealthRecordPartial>,
    defaultValues: { studentId },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (student?.healthRecord) {
      form.reset({ ...student.healthRecord, studentId } as HealthRecordPartial);
    }
  }, [student, studentId, form]);

  const saveMutation = useSaveHealthRecord(studentId);

  const onSave = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    saveMutation.mutate({ studentId, payload: form.getValues() });
  };

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
        <Text style={styles.error}>{error?.message || 'Student not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.meta}>
          {student.studentCode} · {student.gender === 'M' ? 'Male' : 'Female'} · {student.age} yrs
        </Text>
      </View>

      {HEALTH_RECORD_DOMAINS.map((domain) => (
        <DomainSection key={domain.title} domain={domain} control={form.control} />
      ))}

      <Button title="Save" onPress={onSave} loading={saveMutation.isPending && !saveMutation.isPaused} />
      <SaveStatus
        isPending={saveMutation.isPending}
        isPaused={saveMutation.isPaused}
        isSuccess={saveMutation.isSuccess}
        isError={saveMutation.isError}
      />
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
    gap: 16,
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
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.eminence,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
    marginTop: 2,
  },
});
