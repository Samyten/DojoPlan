import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Configuration Supabase manquante. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env, ou utilisez VITE_DATA_BACKEND=local.',
    );
  }

  client ??= createClient(url, anonKey);
  return client;
}
