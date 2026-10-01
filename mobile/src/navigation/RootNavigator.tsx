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
                options={{
                  ...brandedHeader,
                  title: 'My Health',
                  // Students never reach Home, which is where the worker's
                  // Log Out button lives — without this there is no way off a
                  // shared device.
                  headerRight: () => (
                    <Pressable
                      onPress={logout}
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
