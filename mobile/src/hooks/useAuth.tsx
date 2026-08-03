import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { persister } from '../lib/queryClient';

interface User {
  id: number;
  role: 'admin' | 'fieldworker' | 'student';
  name: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
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
        if (res?.success) {
          setUser(res.data.worker ?? res.data.student);
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

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
