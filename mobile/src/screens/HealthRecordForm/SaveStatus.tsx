import { StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type SaveStatusProps = {
  isPending: boolean;
  isPaused: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export function SaveStatus({ isPending, isPaused, isSuccess, isError }: SaveStatusProps) {
  if (isPending && isPaused) {
    return <Text style={[styles.text, styles.offline]}>Offline — will save when reconnected</Text>;
  }
  if (isPending) {
    return <Text style={styles.text}>Saving…</Text>;
  }
  if (isError) {
    return <Text style={[styles.text, styles.error]}>Save failed</Text>;
  }
  if (isSuccess) {
    return <Text style={[styles.text, styles.success]}>Saved</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  offline: {
    color: '#B26A00',
  },
  error: {
    color: '#B3261E',
  },
  success: {
    color: colors.pineGreen,
  },
});
