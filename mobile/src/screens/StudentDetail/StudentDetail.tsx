import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';
import type { Student, HealthRecord, Appointment, RiskCategory } from '@wish2care/shared';
import { countCompletedDomains, isRecordComplete, computeScreeningScores } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ProgressRing } from './ProgressRing';
import { useAuth } from '../../hooks/useAuth';
import { formatDateLong, isUpcoming, nowLocalTime, todayLocalDate } from '../DoctorAppointment/dateUtils';
import type { RootStackParamList } from '../../navigation/types';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };
type StudentDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDetail'>;

function timeGreeting() {
  const hours = new Date().getHours();
  if (hours >= 12 && hours < 17) return 'Good afternoon';
  if (hours >= 17) return 'Good evening';
  return 'Good morning';
}

function riskColor(category: RiskCategory | null): string {
  switch (category) {
    case 'Green - Healthy':
    case 'Light Green - Mild Watch':
      return colors.pineGreen;
    case 'Yellow - Mild Risk':
      return '#B26A00';
    case 'Orange - Moderate Risk':
      return '#C2410C';
    case 'Red - High Risk':
      return '#B3261E';
    default:
      return colors.pineGreen;
  }
}

type QuickActionProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
};

function QuickAction({ icon, label, color, onPress }: QuickActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function StudentDetailScreen() {
  const navigation = useNavigation<StudentDetailNavigationProp>();
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'StudentDetail'>>();
  const { studentId, schoolName } = route.params;
  const {
    data: student,
    isLoading,
    error,
  } = useQuery<StudentWithRecord | null>({
    queryKey: ['students', studentId],
    queryFn: async () => (await fetchApi(`/students/${studentId}`))?.data ?? null,
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'me'],
    queryFn: async () => (await fetchApi('/appointments/me'))?.data ?? [],
    enabled: user?.role === 'student',
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
        <Text style={styles.error}>{error?.message || 'Student not found.'}</Text>
      </View>
    );
  }

  const completed = student.healthRecord ? countCompletedDomains(student.healthRecord) : 0;
  const complete = student.healthRecord ? isRecordComplete(student.healthRecord) : false;
  const remaining = 8 - completed;
  const displaySchoolName = schoolName ?? student.school?.name;
  const scores = student.healthRecord ? computeScreeningScores(student.healthRecord) : null;
  const wellnessScore = scores?.overallHealthScore ?? null;
  const riskCategory = scores?.riskCategory ?? null;
  const upcomingAppointment = appointments?.find((a) => isUpcoming(a, todayLocalDate(), nowLocalTime()));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>{timeGreeting()},</Text>
        <Text style={styles.name}>{student.name}</Text>
        {displaySchoolName ? <Text style={styles.school}>{displaySchoolName}</Text> : null}
      </View>

      <View style={styles.scoreCard}>
        {wellnessScore != null ? (
          <>
            <ProgressRing progress={wellnessScore / 100} size={88} strokeWidth={8} color={riskColor(riskCategory)}>
              <Text style={styles.scoreValue}>{wellnessScore}</Text>
            </ProgressRing>
            <View style={styles.scoreText}>
              <Text style={styles.scoreLabel}>Wellness Score</Text>
              <Text style={[styles.scoreStatus, { color: riskColor(riskCategory) }]}>{riskCategory}</Text>
            </View>
          </>
        ) : (
          <>
            <ProgressRing progress={completed / 8} size={88} strokeWidth={8}>
              <Text style={styles.scoreValue}>{completed}/8</Text>
            </ProgressRing>
            <View style={styles.scoreText}>
              <Text style={styles.scoreLabel}>Screening Progress</Text>
              <Text style={styles.scoreStatus}>
                {complete
                  ? 'Complete'
                  : `${remaining} domain${remaining === 1 ? '' : 's'} remaining for your Wellness Score`}
              </Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <QuickAction
          icon="user"
          label="Doctor"
          color={colors.eminence}
          onPress={() =>
            user?.role === 'student'
              ? navigation.navigate('DoctorAppointment')
              : navigation.navigate('ComingSoon', {
                  title: 'Doctor Appointments',
                  message: 'Scheduling appointments with a doctor is coming soon.',
                })
          }
        />
        <QuickAction
          icon="droplet"
          label="Lab Test"
          color={colors.pineGreen}
          onPress={() =>
            navigation.navigate('ComingSoon', {
              title: 'Lab Tests',
              message: 'Lab test results are coming soon.',
            })
          }
        />
        <QuickAction
          icon="file-text"
          label="Report"
          color={colors.eminence}
          onPress={() => navigation.navigate('StudentReport', { studentId })}
        />
        <QuickAction icon="phone-call" label="SOS" color="#B3261E" onPress={() => Linking.openURL('tel:108')} />
      </View>

      {upcomingAppointment ? (
        <Pressable
          style={({ pressed }) => [styles.appointmentCard, pressed && styles.actionPressed]}
          onPress={() => navigation.navigate('DoctorAppointment')}
          accessibilityRole="button"
          accessibilityLabel="View upcoming doctor appointment"
        >
          <View style={styles.appointmentIcon}>
            <Feather name="calendar" size={20} color={colors.eminence} />
          </View>
          <View style={styles.appointmentText}>
            <Text style={styles.appointmentLabel}>Upcoming Appointment</Text>
            <Text style={styles.appointmentDoctor}>{upcomingAppointment.doctorName}</Text>
            <Text style={styles.appointmentMeta}>
              {formatDateLong(upcomingAppointment.appointmentDate)} · {upcomingAppointment.startTime}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.raisinBlack + '60'} />
        </Pressable>
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
    gap: 24,
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
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.raisinBlack + '90',
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.eminence,
  },
  school: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.raisinBlack + '90',
    marginTop: 2,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
  },
  scoreValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.raisinBlack,
  },
  scoreText: {
    flex: 1,
    gap: 4,
  },
  scoreLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.raisinBlack,
  },
  scoreStatus: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.raisinBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  action: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.raisinBlack,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.eminence + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentText: {
    flex: 1,
    gap: 2,
  },
  appointmentLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.raisinBlack + '90',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentDoctor: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.eminence,
  },
  appointmentMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
});
