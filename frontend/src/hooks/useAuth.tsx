import { createContext, useContext, useState, useEffect } from 'react';
import { ApiError, fetchApi } from '../lib/api';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'fieldworker';
  name: string;
  assignedSchoolId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_KEY = 'wish2care_user';

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (!localStorage.getItem('token')) return null;
    return readCachedUser();
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    // Cached user lets the portal render immediately; /auth/me refreshes in the background.
    return !readCachedUser();
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchApi('/auth/me')
      .then((res) => {
        if (res?.success) {
          setUser(res.data.worker);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.worker));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      })
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : undefined;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, nextUser: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
