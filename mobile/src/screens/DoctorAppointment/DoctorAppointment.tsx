import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Appointment } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../../components/Button';
import { DoctorPicker } from './DoctorPicker';
import { SlotPicker } from './SlotPicker';
import { formatDateLong, isUpcoming, nowLocalTime, todayLocalDate } from './dateUtils';

export function DoctorAppointmentScreen() {
  const queryClient = useQueryClient();
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'me'],
    queryFn: async () => (await fetchApi('/appointments/me'))?.data ?? [],
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => fetchApi(`/appointments/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: (err: Error) => Alert.alert('Could not cancel', err.message),
  });

  const confirmCancel = (appt: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel your appointment with ${appt.doctorName ?? 'the doctor'} on ${formatDateLong(appt.appointmentDate)}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel Appointment', style: 'destructive', onPress: () => cancelMutation.mutate(appt.id) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.eminence} />
      </View>
    );
  }

  const today = todayLocalDate();
  const now = nowLocalTime();
  const upcoming = (appointments ?? []).filter((a) => isUpcoming(a, today, now));
  const history = (appointments ?? []).filter((a) => !isUpcoming(a, today, now));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcoming.map((appt) => (
            <View key={appt.id} style={styles.card}>
              <Text style={styles.doctorName}>{appt.doctorName}</Text>
              <Text style={styles.meta}>{formatDateLong(appt.appointmentDate)}</Text>
              <Text style={styles.meta}>
                {appt.startTime} – {appt.endTime}
              </Text>
              <Button
                title="Cancel Appointment"
                onPress={() => confirmCancel(appt)}
                loading={cancelMutation.isPending}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Book an Appointment</Text>
        <DoctorPicker selectedId={selectedDoctorId} onSelect={setSelectedDoctorId} />
        {selectedDoctorId != null && (
          <SlotPicker doctorId={selectedDoctorId} onBooked={() => setSelectedDoctorId(null)} />
        )}
      </View>

      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.map((appt) => (
            <View key={appt.id} style={[styles.card, styles.historyCard]}>
              <Text style={styles.doctorName}>{appt.doctorName}</Text>
              <Text style={styles.meta}>
                {formatDateLong(appt.appointmentDate)} · {appt.startTime}
              </Text>
              <Text style={styles.statusTag}>{appt.status === 'cancelled' ? 'Cancelled' : 'Past'}</Text>
            </View>
          ))}
        </View>
      )}
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
    gap: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alabaster,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.raisinBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  historyCard: {
    opacity: 0.75,
  },
  doctorName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.eminence,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  statusTag: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.raisinBlack + '90',
    marginTop: 4,
  },
});
