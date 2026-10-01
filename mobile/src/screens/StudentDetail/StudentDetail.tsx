import { ActivityIndicator, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import Feather from '@expo/vector-icons/Feather';
import type { Student, HealthRecord } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk, lora, inter, roboto } from '../../theme/typography';
import { useAuth } from '../../hooks/useAuth';
import type { RootStackParamList } from '../../navigation/types';
import type { ComponentType } from 'react';
import { CallIcon, FileIcon, LabsIcon, StethoscopeIcon } from '../../components/icons/QuickActionIcons';
import { FloatingNavBar } from '../../components/FloatingNavBar';

type StudentWithRecord = Student & { healthRecord: HealthRecord | null };
type StudentDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDetail'>;

type QuickActionProps = {
  icon: ComponentType<{ size?: number; color: string }>;
  label: string;
  color: string;
  onPress: () => void;
};

function QuickAction({ icon: Icon, label, color, onPress }: QuickActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionIcon}>
        <Icon size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

type StayHealthyCardProps = {
  image: number;
  imageStyle: object;
  title: string;
  badgeIcon: keyof typeof Feather.glyphMap;
  badgeColor: string;
  badgeLabel: string;
  onPress: () => void;
  style?: object;
};

function StayHealthyCard({ image, imageStyle, title, badgeIcon, badgeColor, badgeLabel, onPress, style }: StayHealthyCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.healthyCard, style, pressed && styles.actionPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.healthyCardText}>
        <Text style={styles.healthyCardTitle}>{title}</Text>
        <View style={styles.healthyBadge}>
          <Feather name={badgeIcon} size={13} color={badgeColor} />
          <Text style={[styles.healthyBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>
      <ImageBackground source={image} style={[styles.healthyImageCorner, imageStyle]} imageStyle={styles.healthyImageRadius} />
    </Pressable>
  );
}

export function StudentDetailScreen() {
  const navigation = useNavigation<StudentDetailNavigationProp>();
  const { user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, 'StudentDetail'>>();
  const { studentId } = route.params;
  const {
    data: student,
    isLoading,
    error,
  } = useQuery<StudentWithRecord | null>({
    queryKey: ['students', studentId],
    queryFn: async () => (await fetchApi(`/students/${studentId}`))?.data ?? null,
  });

  const goToDoctor = () =>
    user?.role === 'student'
      ? navigation.navigate('DoctorAppointment')
      : navigation.navigate('ComingSoon', {
          title: 'Doctor Appointments',
          message: 'Scheduling appointments with a doctor is coming soon.',
        });

  const goToLabTests = () =>
    navigation.navigate('ComingSoon', { title: 'Lab Tests', message: 'Lab test results are coming soon.' });

  const goToMentalHealth = () => navigation.navigate('MentalHealth', { studentId });

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
        <Text style={styles.error}>{error?.message || 'Student not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, user?.role === 'student' && styles.contentWithNavBar]}
      >
      <ImageBackground
        source={require('../../../assets/images/hero-card-bg.png')}
        style={styles.heroCard}
        imageStyle={styles.heroCardImage}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Get Your Health Score</Text>
          <Text style={styles.heroSub}>Understand your health, risks and next steps.</Text>
          <Pressable
            style={styles.startButton}
            onPress={() => navigation.navigate('StudentReport', { studentId })}
            accessibilityRole="button"
            accessibilityLabel="Start now"
          >
            <Text style={styles.startButtonText}>Start now</Text>
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.actionsGrid}>
        <QuickAction icon={LabsIcon} label="Lab Test" color={colors.iconCyan} onPress={goToLabTests} />
        <QuickAction
          icon={FileIcon}
          label="Report"
          color={colors.iconBlue}
          onPress={() => navigation.navigate('StudentReport', { studentId })}
        />
        <QuickAction icon={StethoscopeIcon} label="Doctor" color={colors.iconAmber} onPress={goToDoctor} />
        <QuickAction icon={CallIcon} label="SOS" color={colors.iconRed} onPress={() => Linking.openURL('tel:108')} />
      </View>

      <View style={styles.staySection}>
        <Text style={styles.stayTitle}>Stay Healthy</Text>
        <View style={styles.stayRow}>
          <StayHealthyCard
            style={styles.doctorCard}
            image={require('../../../assets/images/doctor-illustration.png')}
            imageStyle={styles.doctorImage}
            title="Doctor consultations"
            badgeIcon="check-circle"
            badgeColor={colors.badgeGreen}
            badgeLabel="School paid"
            onPress={goToDoctor}
          />
          <View style={styles.stayRightColumn}>
            <StayHealthyCard
              style={styles.testsCard}
              image={require('../../../assets/images/tests-illustration.png')}
              imageStyle={styles.testsImage}
              title="Tests & checkups"
              badgeIcon="percent"
              badgeColor={colors.badgeOlive}
              badgeLabel="1 free checkup"
              onPress={goToLabTests}
            />
            <StayHealthyCard
              style={styles.mentalCard}
              image={require('../../../assets/images/mental-illustration.png')}
              imageStyle={styles.mentalImage}
              title="Mental health"
              badgeIcon="check-circle"
              badgeColor={colors.badgeTeal}
              badgeLabel="School paid"
              onPress={goToMentalHealth}
            />
          </View>
        </View>
      </View>
      </ScrollView>
      {user?.role === 'student' ? (
        <FloatingNavBar
          active="home"
          onHomePress={() => {}}
          onProfilePress={() => navigation.navigate('Profile')}
        />
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
    paddingTop: 60,
    gap: 20,
  },
  contentWithNavBar: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  error: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    aspectRatio: 374 / 380,
    // The panel sits at the bottom of the artwork. This was space-between
    // while a badge row shared the card; with that gone, flex-end is what
    // keeps the panel down rather than letting it ride to the top.
    justifyContent: 'flex-end',
  },
  heroCardImage: {
    borderRadius: 24,
  },
  heroContent: {
    backgroundColor: colors.heroPanel,
    borderRadius: 31,
    overflow: 'hidden',
    padding: 20,
    gap: 10,
  },
  heroTitle: {
    fontFamily: lora.bold,
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: inter.medium,
    fontSize: 12,
    color: colors.heroSubtext,
    textAlign: 'center',
  },
  startButton: {
    alignSelf: 'center',
    backgroundColor: colors.teal,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  startButtonText: {
    fontFamily: inter.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    alignItems: 'center',
    gap: 10,
    width: '23%',
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.figmaCardBorder,
    backgroundColor: colors.figmaCardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: inter.semiBold,
    fontSize: 12,
    color: '#757575',
  },
  staySection: {
    gap: 16,
  },
  stayTitle: {
    fontFamily: lora.bold,
    fontSize: 16,
    color: colors.teal,
  },
  stayRow: {
    flexDirection: 'row',
    gap: 16,
  },
  healthyCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.figmaCardBg,
    borderWidth: 1,
    borderColor: colors.figmaCardBorder,
    borderRadius: 24,
    padding: 16,
  },
  healthyCardText: {
    gap: 8,
  },
  healthyImageRadius: {
    borderRadius: 16,
  },
  healthyImageCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  doctorCard: {
    flex: 1,
    minHeight: 220,
  },
  doctorImage: {
    width: 130,
    height: 130,
    borderRadius: 16,
  },
  stayRightColumn: {
    flex: 1,
    gap: 12,
  },
  testsCard: {
    minHeight: 124,
  },
  testsImage: {
    width: 72,
    height: 64,
  },
  mentalCard: {
    minHeight: 124,
  },
  mentalImage: {
    width: 90,
    height: 90,
    borderRadius: 2,
  },
  healthyCardTitle: {
    fontFamily: inter.semiBold,
    fontSize: 14,
    color: '#111827',
  },
  healthyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthyBadgeText: {
    fontFamily: roboto.medium,
    fontSize: 11,
  },
});
