import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Teacher } from '../types';
import type { SignInInput } from './authService';

export interface AuthContextValue {
  currentTeacher: Teacher | undefined;
  authUser: User | null;
  loading: boolean;
  error: string | undefined;
  isSupabaseMode: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  setLocalTeacherId: (teacherId: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
