import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type Step = 'phone' | 'otp';

export function StudentLoginForm() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onRequestOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/student-otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res?.success) {
        setDevOtp(res.devOtp ?? null);
        setOtp(res.devOtp ?? '');
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/student-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      if (res?.success) {
        await login(res.data.token, res.data.student);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangePhone = () => {
    setStep('phone');
    setOtp('');
    setDevOtp(null);
    setError(null);
  };

  return (
    <View style={styles.form}>
      {step === 'phone' ? (
        <>
          <TextField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Send OTP" onPress={onRequestOtp} loading={submitting} disabled={!phone} />
        </>
      ) : (
        <>
          <Text style={styles.helper}>Enter the code sent to {phone}</Text>
          <TextField
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            placeholder="123456"
            hint={devOtp ? `Dev mode — OTP: ${devOtp}` : undefined}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Verify & Sign In" onPress={onVerifyOtp} loading={submitting} disabled={otp.length !== 6} />
          <Pressable onPress={onChangePhone} hitSlop={8}>
            <Text style={styles.changePhone}>Change phone number</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    gap: 16,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.raisinBlack + '90',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#B3261E',
  },
  changePhone: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.eminence,
    textAlign: 'center',
  },
});
