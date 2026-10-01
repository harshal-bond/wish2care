import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';
import { SignInScreen } from '../screens/SignIn/SignIn';
import { HomeScreen } from '../screens/Home/Home';
import { StudentDetailScreen } from '../screens/StudentDetail/StudentDetail';
import { StudentReportScreen } from '../screens/StudentReport/StudentReport';
import { HealthRecordFormScreen } from '../screens/HealthRecordForm/HealthRecordForm';
import { ComingSoonScreen } from '../screens/ComingSoon/ComingSoon';
import { ChangePasswordScreen } from '../screens/ChangePassword/ChangePassword';
import { DoctorAppointmentScreen } from '../screens/DoctorAppointment/DoctorAppointment';
import { MentalHealthScreen } from '../screens/MentalHealth/MentalHealth';
import { ProfileScreen } from '../screens/Profile/Profile';
import { OfflineBanner } from '../components/OfflineBanner';
import { CircleBackButton } from '../components/CircleBackButton';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { hankenGrotesk } from '../theme/typography';
import type { RootStackParamList } from './types';

// Matches the Figma "MobileHeader" — white background, dark left-aligned
// title, circular outline back button (see CircleBackButton).
const brandedHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.white },
  headerShadowVisible: false,
  headerTintColor: colors.figmaTextPrimary,
  headerTitleAlign: 'left',
  headerTitleStyle: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 20,
    color: colors.figmaTextPrimary,
  },
  headerLeft: (props: { canGoBack?: boolean }) => <CircleBackButton canGoBack={props.canGoBack} />,
} as const;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.eminence} />
      </View>
    );
  }

  const isStudent = user?.role === 'student';
  // A student holding a temporary password gets this screen and nothing else,
  // so there is no route to navigate around the change.
  const mustChangePassword = user?.role === 'student' && user.mustChangePassword;

  return (
    <>
      {user ? <OfflineBanner /> : null}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : mustChangePassword ? (
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          ) : isStudent ? (
            <>
              {/* Students only ever see their own record. Home is the worker's
                  roster, and HealthRecordForm is a worker-only write the API
                  rejects for students, so neither is registered here. */}
              <Stack.Screen
                name="StudentDetail"
                component={StudentDetailScreen}
                initialParams={{ studentId: user.id }}
                // The Figma Home frame draws its own hero and nav bar, so this
                // screen carries no native header. Log Out lives on Profile,
                // which the FloatingNavBar reaches.
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="StudentReport"
                component={StudentReportScreen}
                options={{ ...brandedHeader, title: 'Report' }}
              />
              <Stack.Screen
                name="DoctorAppointment"
                component={DoctorAppointmentScreen}
                options={{ ...brandedHeader, title: 'Appointments' }}
              />
              <Stack.Screen
                name="MentalHealth"
                component={MentalHealthScreen}
                options={{ ...brandedHeader, title: 'Mental Health' }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ ...brandedHeader, title: 'Profile' }}
              />
              <Stack.Screen
                name="ComingSoon"
                component={ComingSoonScreen}
                options={({ route }) => ({ ...brandedHeader, title: route.params.title ?? 'Coming Soon' })}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="StudentDetail"
                component={StudentDetailScreen}
                options={{ ...brandedHeader, title: 'Student' }}
              />
              <Stack.Screen
                name="StudentReport"
                component={StudentReportScreen}
                options={({ navigation, route }) => ({
                  ...brandedHeader,
                  title: 'Report',
                  headerRight: () => (
                    <Pressable
                      onPress={() => navigation.navigate('HealthRecordForm', { studentId: route.params.studentId })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Edit health record"
                    >
                      <Feather name="edit-2" size={20} color={colors.figmaTextPrimary} />
                    </Pressable>
                  ),
                })}
              />
              <Stack.Screen
                name="HealthRecordForm"
                component={HealthRecordFormScreen}
                options={{ ...brandedHeader, title: 'Edit Record' }}
              />
              <Stack.Screen
                name="ComingSoon"
                component={ComingSoonScreen}
                options={({ route }) => ({ ...brandedHeader, title: route.params.title ?? 'Coming Soon' })}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alabaster,
  },
});
