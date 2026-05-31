import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getDataBackend } from '../config/dataBackend';
import { getDojoData, getDojoDataSnapshot } from '../data/repositories/dojoRepository';
import type { Teacher } from '../types';
import {
  getCurrentAuthUser,
  getTeacherProfileForAuthUser,
  onAuthStateChange,
  signInWithPassword,
  signOut as supabaseSignOut,
  type SignInInput,
} from './authService';
import { AuthContext } from './useAuth';
import { getFriendlyErrorMessage } from '../utils/errors';

export function AuthProvider({ children }: { children: ReactNode }) {
  const isSupabaseMode = getDataBackend() === 'supabase';
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(() => getDojoDataSnapshot().teachers);
  const [localTeacherId, setLocalTeacherId] = useState<string | undefined>(() => localTeachers[0]?.id);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [supabaseTeacher, setSupabaseTeacher] = useState<Teacher | undefined>();
  const [loading, setLoading] = useState(isSupabaseMode);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (isSupabaseMode) {
      return;
    }

    let cancelled = false;

    void getDojoData().then((data) => {
      if (!cancelled) {
        setLocalTeachers(data.teachers);
        setLocalTeacherId((current) => {
          if (current && data.teachers.some((teacher) => teacher.id === current)) {
            return current;
          }

          return data.teachers[0]?.id;
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSupabaseMode]);

  useEffect(() => {
    if (!isSupabaseMode) {
      return;
    }

    let cancelled = false;

    async function loadUser(user: User | null) {
      setAuthUser(user);
      setSupabaseTeacher(undefined);

      if (!user) {
        setLoading(false);
        setError(undefined);
        return;
      }

      try {
        const teacher = await getTeacherProfileForAuthUser(user.id);

        if (!cancelled) {
          setSupabaseTeacher(teacher);
          setError(
            teacher
              ? undefined
              : "Votre compte est connecté, mais aucun profil professeur n'est lié. Contactez l'administrateur.",
          );
        }
      } catch (authError) {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(authError, 'Impossible de charger le profil professeur.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void getCurrentAuthUser()
      .then((user) => loadUser(user))
      .catch((authError: unknown) => {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(authError, 'Impossible de charger la session.'));
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((user) => {
      setLoading(true);
      void loadUser(user);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isSupabaseMode]);

  const currentTeacher = isSupabaseMode
    ? supabaseTeacher
    : localTeachers.find((teacher) => teacher.id === localTeacherId);

  const value = useMemo(
    () => ({
      currentTeacher,
      authUser,
      loading,
      error,
      isSupabaseMode,
      signIn: async (input: SignInInput) => {
        setError(undefined);
        await signInWithPassword(input);
      },
      signOut: async () => {
        setError(undefined);
        await supabaseSignOut();
      },
      setLocalTeacherId,
    }),
    [authUser, currentTeacher, error, isSupabaseMode, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
