import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';

export function SignInScreen() {
  const { login } = useAuth();
  // One field: a student may hold an email, or only a student code. The server
  // resolves whichever matches, so the app never asks them which they have.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      if (res?.success) {
        await login(res.data.token, res.data.student);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = !identifier || !password || submitting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Logo size={40} />

        <View style={styles.form}>
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.subheading}>Use the details your school gave you</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email or student code</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com or STU-0001"
              placeholderTextColor={colors.figmaPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.figmaPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.inputIcon}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.figmaPlaceholder}
                />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
            onPress={onSubmit}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </Pressable>

          <Text style={styles.helper}>
            Your school issues your password. If you've forgotten it, ask your health worker to
            reset it for you.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 40,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  heading: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 24,
    color: colors.figmaTextPrimary,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 14,
    color: colors.figmaTextSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 13,
    color: colors.figmaTextSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.figmaBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontFamily: hankenGrotesk.regular,
    fontSize: 16,
    color: colors.figmaTextPrimary,
    backgroundColor: colors.white,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  helper: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: colors.figmaTextSecondary,
    textAlign: 'center',
  },
  error: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: '#B3261E',
  },
  primaryButton: {
    backgroundColor: colors.teal,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: hankenGrotesk.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});
