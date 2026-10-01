import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ChangePasswordScreen } from './ChangePassword';
import { AuthProvider } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/api';

jest.mock('../../lib/api');
const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return render(<ChangePasswordScreen />, { wrapper });
}

const temp = () => screen.getByPlaceholderText('The one you were given');
const next = () => screen.getByPlaceholderText('At least 8 characters');
const confirm = () => screen.getByPlaceholderText('Type it again');
const save = () => screen.getByLabelText('Save password');

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
    mockedFetchApi.mockResolvedValue({ success: true, data: { student: {} } });
  });

  it('submits when the new password is long enough and confirmed', async () => {
    renderScreen();

    fireEvent.changeText(temp(), 'TempPass12');
    fireEvent.changeText(next(), 'MyNewPass99');
    fireEvent.changeText(confirm(), 'MyNewPass99');
    fireEvent.press(save());

    await waitFor(() =>
      expect(mockedFetchApi).toHaveBeenCalledWith('/auth/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'TempPass12', newPassword: 'MyNewPass99' }),
      })
    );
  });

  it('does not submit when the confirmation does not match', () => {
    renderScreen();

    fireEvent.changeText(temp(), 'TempPass12');
    fireEvent.changeText(next(), 'MyNewPass99');
    fireEvent.changeText(confirm(), 'Different99');
    fireEvent.press(save());

    expect(screen.getByText("These don't match.")).toBeTruthy();
    expect(mockedFetchApi).not.toHaveBeenCalled();
  });

  it('does not submit a password shorter than 8 characters', () => {
    renderScreen();

    fireEvent.changeText(temp(), 'TempPass12');
    fireEvent.changeText(next(), 'short');
    fireEvent.changeText(confirm(), 'short');
    fireEvent.press(save());

    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();
    expect(mockedFetchApi).not.toHaveBeenCalled();
  });

  it('refuses to reuse the temporary password', () => {
    renderScreen();

    fireEvent.changeText(temp(), 'TempPass12');
    fireEvent.changeText(next(), 'TempPass12');
    fireEvent.changeText(confirm(), 'TempPass12');
    fireEvent.press(save());

    expect(screen.getByText('Choose something different from the temporary one.')).toBeTruthy();
    expect(mockedFetchApi).not.toHaveBeenCalled();
  });

  it('surfaces a server error', async () => {
    mockedFetchApi.mockRejectedValue(new Error('Invalid credentials'));
    renderScreen();

    fireEvent.changeText(temp(), 'WrongTemp1');
    fireEvent.changeText(next(), 'MyNewPass99');
    fireEvent.changeText(confirm(), 'MyNewPass99');
    fireEvent.press(save());

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });
});
