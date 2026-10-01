import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { persister } from '../lib/queryClient';

export interface WorkerUser {
  id: number;
  email: string;
  role: 'admin' | 'fieldworker';
  name: string;
}

export interface StudentUser {
  id: number;
  name: string;
  role: 'student';
  studentCode: string;
  email: string | null;
  schoolId: number;
  /** Set when an admin issued a temporary password. Gates the whole app. */
  mustChangePassword: boolean;
}

export type User = WorkerUser | StudentUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  /** Applied after a student changes their password, to clear the gate. */
  updateUser: (patch: Partial<StudentUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(async (token) => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchApi('/auth/me');
        // /auth/me answers { worker } or { student } depending on the token.
        // This app is student-only, so a worker token - which a device can
        // still hold from before that was decided - is discarded rather than
        // restored into a UI that no longer exists for it.
        if (res?.success && res.data.student) {
          setUser(res.data.student);
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = async (token: string, user: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    queryClient.clear();
    await persister.removeClient();
    setUser(null);
  };

  const updateUser = (patch: Partial<StudentUser>) => {
    setUser((current) =>
      current && current.role === 'student' ? { ...current, ...patch } : current
    );
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
