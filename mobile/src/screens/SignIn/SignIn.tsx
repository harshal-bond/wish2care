import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Logo } from '../../components/Logo';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type Mode = 'worker' | 'student';

export function SignInScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('worker');
  // Students sign in with either an email or a student code, so the field is
  // one identifier rather than a typed email input.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    // Carrying a half-typed worker email into the student form is just noise.
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res =
        mode === 'worker'
          ? await fetchApi('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email: identifier.trim(), password }),
            })
          : await fetchApi('/auth/student/login', {
              method: 'POST',
              body: JSON.stringify({ identifier: identifier.trim(), password }),
            });

      if (res?.success) {
        await login(res.data.token, mode === 'worker' ? res.data.worker : res.data.student);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStudent = mode === 'student';

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

          <View style={styles.toggle} accessibilityRole="tablist">
            {(['worker', 'student'] as const).map((value) => {
              const active = mode === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => switchMode(value)}
                  style={[styles.toggleOption, active && styles.toggleOptionActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={value === 'worker' ? 'Sign in as staff' : 'Sign in as student'}
                >
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                    {value === 'worker' ? 'Staff' : 'Student'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label={isStudent ? 'Email or student code' : 'Email'}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType={isStudent ? 'default' : 'email-address'}
            autoCorrect={false}
            placeholder={isStudent ? 'you@example.com or STU-0001' : 'you@wish2care.org'}
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

          {isStudent ? (
            <Text style={styles.help}>
              Your school issues your password. If you've forgotten it, ask your health worker to
              reset it for you.
            </Text>
          ) : null}
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
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.raisinBlack + '10',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.white,
  },
  toggleLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.raisinBlack + 'A0',
  },
  toggleLabelActive: {
    color: colors.eminence,
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
