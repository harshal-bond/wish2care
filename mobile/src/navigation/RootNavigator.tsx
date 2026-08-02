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
  const { user, loading } = useAuth();

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
          {user ? (
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
