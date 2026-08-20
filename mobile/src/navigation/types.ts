export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  StudentDetail: { studentId: number; schoolName?: string };
  StudentReport: { studentId: number };
  HealthRecordForm: { studentId: number };
  DoctorAppointment: undefined;
  ComingSoon: { title: string; message: string };
};
