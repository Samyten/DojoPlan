export type DataBackend = 'local' | 'supabase';

export function getDataBackend(): DataBackend {
  const configuredBackend = import.meta.env.VITE_DATA_BACKEND;

  if (configuredBackend === 'supabase') {
    return 'supabase';
  }

  if (configuredBackend === 'local') {
    return 'local';
  }

  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? 'supabase'
    : 'local';
}

export function isSupabaseBackend() {
  return getDataBackend() === 'supabase';
}
