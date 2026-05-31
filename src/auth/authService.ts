import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabaseClient';
import type { Teacher } from '../types';

export interface SignInInput {
  email: string;
  password: string;
}

export async function signInWithPassword({ email, password }: SignInInput) {
  const { error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentAuthUser() {
  const { data, error } = await getSupabaseClient().auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}

export async function getTeacherProfileForAuthUser(userId: string): Promise<Teacher | undefined> {
  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .select('id,auth_user_id,name,email,role,created_at')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return undefined;
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id ?? undefined,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}
