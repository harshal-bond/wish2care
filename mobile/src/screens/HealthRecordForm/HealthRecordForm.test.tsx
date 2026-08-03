import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { HealthRecordFormScreen } from './HealthRecordForm';
import { fetchApi } from '../../lib/api';

jest.mock('../../lib/api');
const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({ params: { studentId: 1 } }),
}));

const mockStudent = {
  id: 1,
  studentCode: 'STU-001',
  name: 'Asha Kumar',
  age: 12,
  gender: 'F',
  schoolId: 1,
  createdAt: new Date().toISOString(),
  healthRecord: {
    id: 1,
    studentId: 1,
    date: null,
    height: 140,
    weight: 32,
    undernutritionClass: 'Normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

let activeQueryClient: QueryClient | undefined;

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  activeQueryClient = queryClient;
  queryClient.setQueryData(['students', 1], mockStudent);
  return render(
    <QueryClientProvider client={queryClient}>
      <HealthRecordFormScreen />
    </QueryClientProvider>
  );
}

describe('HealthRecordFormScreen', () => {
  beforeEach(() => {
    mockedFetchApi.mockReset();
    mockedFetchApi.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/students/1') {
        return { success: true, data: mockStudent };
      }
      return { success: true, data: { ...mockStudent.healthRecord } };
    });
  });

  afterEach(() => {
    activeQueryClient?.clear();
    activeQueryClient = undefined;
  });

  it('pre-fills existing values from the cached student record', async () => {
    const { findByDisplayValue } = renderScreen();

    expect(await findByDisplayValue('140')).toBeTruthy();
  });

  it('saves an edited field via PUT /health-records/:id', async () => {
    const { findByDisplayValue, getByText } = renderScreen();
    const heightInput = await findByDisplayValue('140');

    fireEvent.changeText(heightInput, '142');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockedFetchApi).toHaveBeenCalledWith(
        '/health-records/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"height":142'),
        })
      );
    });
  });

  it('pauses the save and shows an offline status instead of erroring when offline', async () => {
    onlineManager.setOnline(false);
    try {
      const { findByDisplayValue, getByText } = renderScreen();
      const heightInput = await findByDisplayValue('140');

      fireEvent.changeText(heightInput, '142');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(getByText('Offline — will save when reconnected')).toBeTruthy();
      });
      expect(mockedFetchApi).not.toHaveBeenCalledWith('/health-records/1', expect.objectContaining({ method: 'PUT' }));
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
