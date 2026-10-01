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

const identifier = () => screen.getByPlaceholderText('you@example.com or STU-0001');
const password = () => screen.getByPlaceholderText('••••••••');

describe('SignInScreen', () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
    mockedFetchApi.mockResolvedValue({ success: false });
  });

  it('signs in with a student code', async () => {
    renderSignIn();

    fireEvent.changeText(identifier(), 'STU-0001');
    fireEvent.changeText(password(), 'TempPass12');
    fireEvent.press(screen.getByLabelText('Sign In'));

    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'STU-0001', password: 'TempPass12' }),
      })
    );
  });

  it('signs in with an email, trimmed', async () => {
    renderSignIn();

    // A tapped-in email often picks up a trailing space.
    fireEvent.changeText(identifier(), '  asha@example.com  ');
    fireEvent.changeText(password(), 'TempPass12');
    fireEvent.press(screen.getByLabelText('Sign In'));

    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: 'asha@example.com', password: 'TempPass12' }),
      })
    );
  });

  it('offers no staff sign-in', () => {
    renderSignIn();

    expect(screen.queryByLabelText('Sign in as staff')).toBeNull();
    expect(screen.queryByText('Staff')).toBeNull();
  });

  it('never calls the worker login endpoint', async () => {
    renderSignIn();

    fireEvent.changeText(identifier(), 'worker@wish2care.org');
    fireEvent.changeText(password(), 'secret123');
    fireEvent.press(screen.getByLabelText('Sign In'));

    await waitFor(() => expect(mockedFetchApi).toHaveBeenCalled());
    expect(mockedFetchApi).not.toHaveBeenCalledWith('/auth/login', expect.anything());
  });

  it('surfaces the API error message', async () => {
    mockedFetchApi.mockRejectedValue(new Error('Invalid credentials'));
    renderSignIn();

    fireEvent.changeText(identifier(), 'STU-0001');
    fireEvent.changeText(password(), 'wrong');
    fireEvent.press(screen.getByLabelText('Sign In'));

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });
});
