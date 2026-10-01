import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SignInScreen } from './SignIn';
import { AuthProvider } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';

jest.mock('../../lib/api');
const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

function renderSignIn() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return render(<SignInScreen />, { wrapper });
}

describe('SignInScreen', () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
    mockedFetchApi.mockResolvedValue({ success: false });
  });

  it('defaults to staff mode and posts to the worker endpoint', async () => {
    renderSignIn();

    fireEvent.changeText(screen.getByPlaceholderText('you@wish2care.org'), 'w@wish2care.org');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByLabelText('Sign In'));

    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'w@wish2care.org', password: 'secret123' }),
      })
    );
  });

  it('posts the identifier to the student endpoint in student mode', async () => {
    renderSignIn();

    fireEvent.press(screen.getByLabelText('Sign in as student'));
    fireEvent.changeText(
      screen.getByPlaceholderText('you@example.com or STU-0001'),
      'STU-0001'
    );
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'TempPass12');
    fireEvent.press(screen.getByLabelText('Sign In'));

    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'STU-0001', password: 'TempPass12' }),
      })
    );
  });

  it('accepts an email as the student identifier', async () => {
    renderSignIn();

    fireEvent.press(screen.getByLabelText('Sign in as student'));
    fireEvent.changeText(
      screen.getByPlaceholderText('you@example.com or STU-0001'),
      '  asha@example.com  '
    );
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'TempPass12');
    fireEvent.press(screen.getByLabelText('Sign In'));

    // Trimmed, since a tapped-in email often picks up a trailing space.
    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'asha@example.com', password: 'TempPass12' }),
      })
    );
  });

  it('clears typed credentials when switching mode', () => {
    renderSignIn();

    fireEvent.changeText(screen.getByPlaceholderText('you@wish2care.org'), 'w@wish2care.org');
    fireEvent.press(screen.getByLabelText('Sign in as student'));

    expect(screen.getByPlaceholderText('you@example.com or STU-0001').props.value).toBe('');
  });

  it('surfaces the API error message', async () => {
    mockedFetchApi.mockRejectedValue(new Error('Invalid credentials'));
    renderSignIn();

    fireEvent.changeText(screen.getByPlaceholderText('you@wish2care.org'), 'w@wish2care.org');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'wrong');
    fireEvent.press(screen.getByLabelText('Sign In'));

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });
});
