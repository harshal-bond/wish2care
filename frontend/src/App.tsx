import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentFormPage } from './pages/StudentFormPage';
import { ExportPage } from './pages/ExportPage';
import { SchoolsPage } from './pages/SchoolsPage';
import { MentalHealthFormPage } from './pages/MentalHealthFormPage';
import { SchoolAuditFormPage } from './pages/SchoolAuditFormPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { StudentDataPage } from './pages/StudentDataPage';
import { StaffPage } from './pages/StaffPage';
import { StaffProfilePage } from './pages/StaffProfilePage';
import { StaffFormPage } from './pages/StaffFormPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentProfilePage />} />
              <Route path="/students/:id/health-record" element={<StudentFormPage />} />
              <Route path="/students/:id/mental-health" element={<MentalHealthFormPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/staff/:id" element={<StaffProfilePage />} />
              <Route path="/staff/:id/assessment" element={<StaffFormPage />} />
              <Route path="/schools" element={<ProtectedRoute requireAdmin><SchoolsPage /></ProtectedRoute>} />
              <Route path="/schools/:id/audit" element={<ProtectedRoute requireAdmin><SchoolAuditFormPage /></ProtectedRoute>} />
              <Route path="/student-data" element={<ProtectedRoute requireAdmin><StudentDataPage /></ProtectedRoute>} />
              <Route path="/export" element={<ProtectedRoute requireAdmin><ExportPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
