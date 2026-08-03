import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

export function ComingSoonScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ComingSoon'>>();
  const { message } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Feather name="clock" size={28} color={colors.eminence} />
      </View>
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.alabaster,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.eminence + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.eminence,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.raisinBlack + '90',
    textAlign: 'center',
    lineHeight: 20,
  },
});
