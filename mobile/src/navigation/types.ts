export type RootStackParamList = {
  SignIn: undefined;
  ChangePassword: undefined;
  Home: undefined;
  StudentDetail: { studentId: number; schoolName?: string };
  StudentReport: { studentId: number };
  HealthRecordForm: { studentId: number };
  ComingSoon: { title: string; message: string };
};
