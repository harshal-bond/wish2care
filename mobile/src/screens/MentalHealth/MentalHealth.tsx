import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { MentalHealthAssessment } from '@wish2care/shared';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';
import { formatDateLong } from '../DoctorAppointment/dateUtils';
import type { RootStackParamList } from '../../navigation/types';

const MAX_SCORE_PER_QUESTION = 5;

export function MentalHealthScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MentalHealth'>>();
  const { studentId } = route.params;

  const {
    data: assessments,
    isLoading,
    error,
  } = useQuery<MentalHealthAssessment[]>({
    queryKey: ['students', studentId, 'mental-health'],
    queryFn: async () => (await fetchApi(`/students/${studentId}/mental-health`))?.data ?? [],
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error.message || 'Could not load mental health history.'}</Text>
      </View>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No mental health assessments recorded yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Mental health awareness assessment history</Text>

      {assessments.map((assessment) => {
        const questionCount = Object.keys(assessment.responses).length;
        const maxScore = questionCount * MAX_SCORE_PER_QUESTION;

        return (
          <View key={assessment.id} style={styles.card}>
            <Text style={styles.date}>{formatDateLong(assessment.date)}</Text>
            {assessment.totalScore != null ? (
              <Text style={styles.score}>
                Score: <Text style={styles.scoreValue}>{assessment.totalScore}</Text>
                {maxScore > 0 ? ` / ${maxScore}` : ''}
              </Text>
            ) : (
              <Text style={styles.score}>Score not recorded</Text>
            )}
          </View>
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
    paddingHorizontal: 24,
  },
  error: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
  },
  empty: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  date: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 15,
    color: colors.figmaTextPrimary,
  },
  score: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
  },
  scoreValue: {
    fontFamily: hankenGrotesk.semiBold,
    color: colors.teal,
  },
});
