import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Appointment, Student } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';
import { useAuth } from '../../hooks/useAuth';
import { BookAppointmentSheet } from './BookAppointmentSheet';
import { formatDateCard, formatTime12h, isUpcoming, nowLocalTime, todayLocalDate } from './dateUtils';

type Tab = 'upcoming' | 'past';

export function DoctorAppointmentScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [booking, setBooking] = useState(false);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'me'],
    queryFn: async () => (await fetchApi('/appointments/me'))?.data ?? [],
  });

  // Shares the ['students', id] cache key with StudentDetail — if the student
  // already viewed their own Health Passport this session, this is instant.
  const { data: student } = useQuery<Student | null>({
    queryKey: ['students', user?.id],
    queryFn: async () => (await fetchApi(`/students/${user?.id}`))?.data ?? null,
    enabled: user?.role === 'student',
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
      `Cancel your appointment with ${appt.doctorName ?? 'the doctor'} on ${formatDateCard(appt.appointmentDate)}?`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel Appointment', style: 'destructive', onPress: () => cancelMutation.mutate(appt.id) },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  const today = todayLocalDate();
  const now = nowLocalTime();
  const upcoming = (appointments ?? []).filter((a) => isUpcoming(a, today, now));
  const past = (appointments ?? []).filter((a) => !isUpcoming(a, today, now));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Upcoming and past care visits</Text>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
          onPress={() => setTab('upcoming')}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'upcoming' }}
        >
          <Text style={[styles.segmentText, tab === 'upcoming' && styles.segmentTextActive]}>Upcoming</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'past' && styles.segmentBtnActive]}
          onPress={() => setTab('past')}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'past' }}
        >
          <Text style={[styles.segmentText, tab === 'past' && styles.segmentTextActive]}>Past</Text>
        </Pressable>
      </View>

      {list.length === 0 ? (
        <Text style={styles.empty}>
          {tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}
        </Text>
      ) : (
        <View style={styles.list}>
          {list.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              isUpcomingTab={tab === 'upcoming'}
              onCancel={() => confirmCancel(appt)}
              cancelling={cancelMutation.isPending}
            />
          ))}
        </View>
      )}

      <View style={styles.bookSection}>
        <Pressable
          style={styles.bookToggle}
          onPress={() => setBooking(true)}
          accessibilityRole="button"
          accessibilityLabel="Book a new appointment"
        >
          <Text style={styles.bookToggleText}>+ Book New Appointment</Text>
        </Pressable>
      </View>

      <BookAppointmentSheet
        visible={booking}
        onClose={() => setBooking(false)}
        studentEmail={student?.email ?? null}
      />
    </ScrollView>
  );
}

type AppointmentCardProps = {
  appt: Appointment;
  isUpcomingTab: boolean;
  onCancel: () => void;
  cancelling: boolean;
};

function AppointmentCard({ appt, isUpcomingTab, onCancel, cancelling }: AppointmentCardProps) {
  const status = appt.status === 'cancelled'
    ? { label: 'Cancelled', bg: colors.statusNeutralBg, border: colors.statusNeutralBg, dot: colors.statusNeutralText, text: colors.statusNeutralText }
    : isUpcomingTab
      ? { label: 'Confirmed', bg: colors.statusGreenBg, border: colors.statusGreenBorder, dot: colors.statusGreenDot, text: colors.statusGreenText }
      : { label: 'Completed', bg: colors.statusNeutralBg, border: colors.statusNeutralBg, dot: colors.statusNeutralText, text: colors.statusNeutralText };

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.dateTimeCol}>
          <Text style={styles.dateText}>{formatDateCard(appt.appointmentDate)}</Text>
          <Text style={styles.timeText}>{formatTime12h(appt.startTime)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.doctorCol}>
          <View style={styles.doctorNameRow}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {appt.doctorName ?? 'Doctor'}
            </Text>
            {appt.meetLink ? (
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>Video Call</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.metaText}>
            {formatTime12h(appt.startTime)} – {formatTime12h(appt.endTime)}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <Text style={[styles.statusPillText, { color: status.text }]}>{status.label}</Text>
        </View>

        {isUpcomingTab && appt.status !== 'cancelled' ? (
          appt.meetLink ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(appt.meetLink!)}
              accessibilityRole="button"
              accessibilityLabel="Join Meet"
            >
              <Text style={styles.actionBtnText}>Join Meet</Text>
            </Pressable>
          ) : (
            <Text style={styles.meetPending}>Meet link pending</Text>
          )
        ) : null}
      </View>

      {isUpcomingTab && appt.status !== 'cancelled' ? (
        <Pressable
          onPress={onCancel}
          disabled={cancelling}
          style={styles.cancelLink}
          accessibilityRole="button"
          accessibilityLabel="Cancel appointment"
        >
          <Text style={styles.cancelLinkText}>{cancelling ? 'Cancelling…' : 'Cancel Appointment'}</Text>
        </Pressable>
      ) : null}
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
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  subtitle: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.figmaSegmentBg,
    borderRadius: 24,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 14,
    color: colors.figmaTextSecondary,
  },
  segmentTextActive: {
    fontFamily: hankenGrotesk.semiBold,
    color: colors.teal,
  },
  empty: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: colors.figmaTextSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    padding: 12,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeCol: {
    gap: 2,
  },
  dateText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 24,
    color: colors.figmaTextPrimary,
  },
  timeText: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 16,
    color: colors.figmaTextSecondary,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.figmaDivider,
  },
  doctorCol: {
    flex: 1,
    gap: 6,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  doctorName: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.figmaTextPrimary,
    flexShrink: 1,
  },
  videoBadge: {
    backgroundColor: colors.statusBlueBg,
    borderWidth: 1,
    borderColor: colors.statusBlueBorder,
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  videoBadgeText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 12,
    color: colors.statusBlueText,
  },
  metaText: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 12,
    color: colors.figmaTextSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionBtnText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.teal,
  },
  meetPending: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.figmaTextSecondary,
  },
  cancelLink: {
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  cancelLinkText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 12,
    color: colors.figmaTextSecondary,
    textDecorationLine: 'underline',
  },
  bookSection: {
    marginTop: 8,
  },
  bookToggle: {
    backgroundColor: colors.teal,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookToggleText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});
