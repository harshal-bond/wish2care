import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';
import type { Doctor, DoctorSlot } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';
import { TextField } from '../../components/TextField';
import { formatDateShort, formatTime12h, nextBookableDates } from './dateUtils';

const DATE_RANGE = nextBookableDates(14);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'clinician' | 'date' | 'time';

type BookAppointmentSheetProps = {
  visible: boolean;
  onClose: () => void;
  studentEmail: string | null;
};

export function BookAppointmentSheet({ visible, onClose, studentEmail }: BookAppointmentSheetProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Field | null>('clinician');
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<DoctorSlot | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (visible) setEmail(studentEmail ?? '');
  }, [visible, studentEmail]);

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => (await fetchApi('/doctors'))?.data ?? [],
    enabled: visible,
  });

  const { data: slots, isLoading: slotsLoading } = useQuery<DoctorSlot[]>({
    queryKey: ['doctors', doctorId, 'slots', date],
    queryFn: async () => (await fetchApi(`/doctors/${doctorId}/slots?date=${date}`))?.data ?? [],
    enabled: visible && doctorId != null && date != null,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/doctors/${doctorId}/appointments`, {
        method: 'POST',
        body: JSON.stringify({ date, startTime: time!.startTime, email: email.trim() }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', doctorId, 'slots', date] });
      reset();
      onClose();
    },
    onError: (err: Error) => Alert.alert('Booking failed', err.message),
  });

  function reset() {
    setExpanded('clinician');
    setDoctorId(null);
    setDate(null);
    setTime(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggle(field: Field, allowed: boolean) {
    if (!allowed) return;
    setExpanded((current) => (current === field ? null : field));
  }

  const selectedDoctor = doctors?.find((d) => d.id === doctorId) ?? null;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const canConfirm = doctorId != null && date != null && time != null && emailValid;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.handle} />
            <Text style={styles.title}>Book appointment</Text>
            <Text style={styles.subtitle}>Choose a clinician and your preferred time.</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Visit type</Text>
              <View style={styles.inputStatic}>
                <Text style={styles.inputText}>Video consultation (Google Meet)</Text>
              </View>
            </View>

            <FieldPicker
              label="Clinician"
              placeholder="Select a clinician"
              value={selectedDoctor?.name ?? null}
              expanded={expanded === 'clinician'}
              onToggle={() => toggle('clinician', true)}
              icon="chevron-down"
            >
              {doctorsLoading ? (
                <ActivityIndicator color={colors.teal} style={styles.panelLoading} />
              ) : !doctors || doctors.length === 0 ? (
                <Text style={styles.emptyText}>No clinicians available right now.</Text>
              ) : (
                doctors.map((doctor) => (
                  <Pressable
                    key={doctor.id}
                    style={styles.optionRow}
                    onPress={() => {
                      setDoctorId(doctor.id);
                      setDate(null);
                      setTime(null);
                      setExpanded('date');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={doctor.name}
                  >
                    <Text style={styles.optionText}>{doctor.name}</Text>
                    {doctor.specialization ? <Text style={styles.optionSub}>{doctor.specialization}</Text> : null}
                  </Pressable>
                ))
              )}
            </FieldPicker>

            <FieldPicker
              label="Date"
              placeholder={doctorId == null ? 'Select a clinician first' : 'Select date'}
              value={date ? formatDateShort(date) : null}
              expanded={expanded === 'date'}
              onToggle={() => toggle('date', doctorId != null)}
              disabled={doctorId == null}
              icon="calendar"
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
                {DATE_RANGE.map((d) => {
                  const selected = d === date;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setDate(d);
                        setTime(null);
                        setExpanded('time');
                      }}
                      style={[styles.dateChip, selected && styles.dateChipSelected]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.dateChipText, selected && styles.dateChipTextSelected]}>
                        {formatDateShort(d)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </FieldPicker>

            <FieldPicker
              label="Time"
              placeholder={date == null ? 'Select clinician & date first' : 'Select time'}
              value={time ? formatTime12h(time.startTime) : null}
              expanded={expanded === 'time'}
              onToggle={() => toggle('time', date != null)}
              disabled={date == null}
              icon="clock"
            >
              {slotsLoading ? (
                <ActivityIndicator color={colors.teal} style={styles.panelLoading} />
              ) : !slots || slots.length === 0 ? (
                <Text style={styles.emptyText}>No slots on this date.</Text>
              ) : (
                <View style={styles.slotGrid}>
                  {slots.map((slot) => {
                    const selected = time?.startTime === slot.startTime;
                    return (
                      <Pressable
                        key={slot.startTime}
                        disabled={!slot.available}
                        onPress={() => {
                          setTime(slot);
                          setExpanded(null);
                        }}
                        style={[styles.slot, !slot.available && styles.slotDisabled, selected && styles.slotSelected]}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !slot.available, selected }}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            !slot.available && styles.slotTextDisabled,
                            selected && styles.slotTextSelected,
                          ]}
                        >
                          {formatTime12h(slot.startTime)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </FieldPicker>

            <View style={styles.emailField}>
              <TextField
                label="Email for meeting invite"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryCta, (!canConfirm || bookMutation.isPending) && styles.ctaDisabled]}
                disabled={!canConfirm || bookMutation.isPending}
                onPress={() => bookMutation.mutate()}
                accessibilityRole="button"
                accessibilityLabel="Confirm booking"
              >
                {bookMutation.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryCtaText}>Confirm booking</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.ghostCta}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.ghostCtaText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type FieldPickerProps = {
  label: string;
  placeholder: string;
  value: string | null;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  children: ReactNode;
};

function FieldPicker({ label, placeholder, value, expanded, onToggle, disabled, icon, children }: FieldPickerProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded }}
      >
        <Text style={[styles.inputText, !value && styles.inputPlaceholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Feather name={icon} size={18} color={colors.figmaPlaceholder} />
      </Pressable>
      {expanded ? <View style={styles.optionsPanel}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.figmaBackdrop,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.figmaBorder,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 18,
    color: colors.figmaTextPrimary,
  },
  subtitle: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: colors.figmaTextSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  field: {
    gap: 6,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 13,
    color: colors.figmaTextSecondary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  inputStatic: {
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.figmaSegmentBg,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputText: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextPrimary,
    flexShrink: 1,
  },
  inputPlaceholder: {
    color: colors.figmaPlaceholder,
  },
  optionsPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 14,
    padding: 8,
    gap: 2,
  },
  panelLoading: {
    marginVertical: 8,
  },
  emptyText: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: colors.figmaTextSecondary,
    padding: 8,
  },
  optionRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 14,
    color: colors.figmaTextPrimary,
  },
  optionSub: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 12,
    color: colors.figmaTextSecondary,
    marginTop: 1,
  },
  dateStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dateChipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  dateChipText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 12,
    color: colors.figmaTextPrimary,
  },
  dateChipTextSelected: {
    color: colors.white,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 76,
    alignItems: 'center',
  },
  slotDisabled: {
    borderColor: colors.figmaBorder,
    backgroundColor: colors.figmaSegmentBg,
  },
  slotSelected: {
    backgroundColor: colors.teal,
  },
  slotText: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 13,
    color: colors.teal,
  },
  slotTextDisabled: {
    color: colors.figmaTextSecondary,
  },
  slotTextSelected: {
    color: colors.white,
  },
  emailField: {
    marginBottom: 16,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  primaryCta: {
    backgroundColor: colors.teal,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  primaryCtaText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  ghostCta: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostCtaText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.figmaTextPrimary,
  },
});
