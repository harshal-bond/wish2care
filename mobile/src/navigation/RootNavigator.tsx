import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';
import { SignInScreen } from '../screens/SignIn/SignIn';
import { HomeScreen } from '../screens/Home/Home';
import { StudentDetailScreen } from '../screens/StudentDetail/StudentDetail';
import { StudentReportScreen } from '../screens/StudentReport/StudentReport';
import { HealthRecordFormScreen } from '../screens/HealthRecordForm/HealthRecordForm';
import { DoctorAppointmentScreen } from '../screens/DoctorAppointment/DoctorAppointment';
import { ComingSoonScreen } from '../screens/ComingSoon/ComingSoon';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import type { RootStackParamList } from './types';

const brandedHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.eminence },
  headerTintColor: colors.white,
} as const;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.eminence} />
      </View>
    );
  }

  return (
    <>
      {user ? <OfflineBanner /> : null}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user?.role === 'student' ? (
            <>
              <Stack.Screen
                name="StudentDetail"
                component={StudentDetailScreen}
                initialParams={{ studentId: user.id }}
                options={{
                  ...brandedHeader,
                  title: 'My Health Passport',
                  headerRight: () => (
                    <Pressable
                      onPress={confirmLogout}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Log out"
                    >
                      <Feather name="log-out" size={20} color={colors.white} />
                    </Pressable>
                  ),
                }}
              />
              <Stack.Screen
                name="StudentReport"
                component={StudentReportScreen}
                options={{ ...brandedHeader, title: 'Report' }}
              />
              <Stack.Screen
                name="DoctorAppointment"
                component={DoctorAppointmentScreen}
                options={{ ...brandedHeader, title: 'Doctor Appointment' }}
              />
              <Stack.Screen
                name="ComingSoon"
                component={ComingSoonScreen}
                options={({ route }) => ({ ...brandedHeader, title: route.params.title ?? 'Coming Soon' })}
              />
            </>
          ) : user ? (
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
                      <Feather name="edit-2" size={20} color={colors.white} />
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
          ) : (
            <Stack.Screen name="SignIn" component={SignInScreen} />
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
