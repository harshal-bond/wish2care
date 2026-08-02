import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, style, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, secureTextEntry && styles.inputWithIcon, style]}
          placeholderTextColor={colors.raisinBlack + '80'}
          autoCapitalize="none"
          secureTextEntry={secureTextEntry ? !visible : secureTextEntry}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.icon}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={colors.raisinBlack + '80'} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.raisinBlack,
  },
  inputWrapper: {
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.raisinBlack + '30',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.raisinBlack,
    backgroundColor: colors.white,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  icon: {
    position: 'absolute',
    right: 14,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#B26A00',
  },
});
