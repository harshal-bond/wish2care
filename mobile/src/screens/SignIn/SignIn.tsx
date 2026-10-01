import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function SignInScreen() {
  const { login } = useAuth();
  // One field: students may hold an email, or only a student code. The server
  // resolves whichever matches, so the app never asks them which they have.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

          <TextField
            label="Email or student code"
            value={identifier}
            onChangeText={setIdentifier}
            autoCorrect={false}
            placeholder="you@example.com or STU-0001"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Sign In"
            onPress={onSubmit}
            loading={submitting}
            disabled={!identifier || !password}
          />

          <Text style={styles.help}>
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
    backgroundColor: colors.alabaster,
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
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.eminence,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#B3261E',
  },
  help: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.raisinBlack + 'A0',
    textAlign: 'center',
  },
});
