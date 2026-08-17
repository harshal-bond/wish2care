import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DoctorSlot } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { formatDateShort, nextBookableDates } from './dateUtils';

const DATE_RANGE = nextBookableDates(14);

type SlotPickerProps = {
  doctorId: number;
  onBooked: () => void;
};

export function SlotPicker({ doctorId, onBooked }: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(DATE_RANGE[0]);
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  // Switched doctors — reset back to the nearest bookable date.
  useEffect(() => {
    setSelectedDate(DATE_RANGE[0]);
  }, [doctorId]);

  const { data: slots, isLoading } = useQuery<DoctorSlot[]>({
    queryKey: ['doctors', doctorId, 'slots', selectedDate],
    queryFn: async () => (await fetchApi(`/doctors/${doctorId}/slots?date=${selectedDate}`))?.data ?? [],
  });

  const bookMutation = useMutation({
    mutationFn: (startTime: string) =>
      fetchApi(`/doctors/${doctorId}/appointments`, {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate, startTime }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', doctorId, 'slots', selectedDate] });
      onBooked();
    },
    onError: (err: Error) => Alert.alert('Booking failed', err.message),
  });

  const confirmBook = (slot: DoctorSlot) => {
    Alert.alert(
      'Confirm Appointment',
      `Book ${formatDateShort(selectedDate)}, ${slot.startTime} – ${slot.endTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book', onPress: () => bookMutation.mutate(slot.startTime) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        {DATE_RANGE.map((date) => {
          const selected = date === selectedDate;
          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dateChip, selected && styles.dateChipSelected]}
            >
              <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                {formatDateShort(date)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!isOnline ? (
        <Text style={styles.offline}>You're offline — reconnect to book an appointment.</Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.eminence} style={styles.loading} />
      ) : !slots || slots.length === 0 ? (
        <Text style={styles.empty}>No slots on this date.</Text>
      ) : (
        <View style={styles.grid}>
          {slots.map((slot) => (
            <Pressable
              key={slot.startTime}
              disabled={!slot.available || !isOnline || bookMutation.isPending}
              onPress={() => confirmBook(slot)}
              style={[styles.slot, !slot.available && styles.slotDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !slot.available || !isOnline }}
              accessibilityLabel={`${slot.startTime} to ${slot.endTime}${slot.available ? '' : ', unavailable'}`}
            >
              <Text style={[styles.slotText, !slot.available && styles.slotTextDisabled]}>{slot.startTime}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 12,
  },
  dateStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: colors.raisinBlack + '20',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dateChipSelected: {
    backgroundColor: colors.eminence,
    borderColor: colors.eminence,
  },
  dateChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.raisinBlack,
  },
  dateChipTextSelected: {
    color: colors.white,
  },
  offline: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#B26A00',
  },
  loading: {
    marginVertical: 12,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    borderWidth: 1,
    borderColor: colors.pineGreen,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  slotDisabled: {
    borderColor: colors.raisinBlack + '15',
    backgroundColor: colors.raisinBlack + '08',
  },
  slotText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.pineGreen,
  },
  slotTextDisabled: {
    color: colors.raisinBlack + '40',
  },
});
