import { StyleSheet, Text, View } from 'react-native';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You're offline — changes will be saved when you reconnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#B26A00',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
  },
});
