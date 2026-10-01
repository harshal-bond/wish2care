import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { hankenGrotesk } from '../../theme/typography';

/** Mirrors studentChangePasswordSchema's min(8) so the server never has to say no. */
const MIN_LENGTH = 8;

/**
 * Shown instead of the app — not on top of it — while a student still holds
 * the temporary password an admin issued. RootNavigator renders this as the
 * only screen in that state, so there is no back gesture to skip it with.
 */
export function ChangePasswordScreen() {
  const { user, logout, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tooShort = newPassword.length > 0 && newPassword.length < MIN_LENGTH;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_LENGTH &&
    newPassword === confirmPassword &&
    !sameAsCurrent;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res?.success) {
        // Clears the gate; the navigator swaps in the real app on next render.
        updateUser({ mustChangePassword: false });
      }
    } catch (err: any) {
      setError(err.message || 'Could not change your password. Please try again.');
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
        <View style={styles.form}>
          <Text style={styles.heading}>Choose a password</Text>
          <Text style={styles.subheading}>
            {user?.name ? `Hi ${user.name.split(' ')[0]} — y` : 'Y'}ou're signed in with a temporary
            password. Pick your own to continue.
          </Text>

          <TextField
            label="Temporary password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="The one you were given"
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder={`At least ${MIN_LENGTH} characters`}
            hint={
              tooShort
                ? `Use at least ${MIN_LENGTH} characters.`
                : sameAsCurrent
                  ? 'Choose something different from the temporary one.'
                  : undefined
            }
          />
          <TextField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Type it again"
            hint={mismatch ? "These don't match." : undefined}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Save password"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
          />

          <Pressable onPress={logout} hitSlop={8} accessibilityRole="button">
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
    marginBottom: 8,
  },
  error: {
    fontFamily: hankenGrotesk.regular,
    fontSize: 13,
    color: '#B3261E',
  },
  signOut: {
    fontFamily: hankenGrotesk.medium,
    fontSize: 13,
    color: colors.teal,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
