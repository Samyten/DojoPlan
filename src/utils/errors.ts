export function getFriendlyErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('configuration supabase manquante')) {
    return import.meta.env.DEV
      ? message
      : "La connexion n'est pas correctement configurée. Contactez l'administrateur.";
  }

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('email not confirmed')
  ) {
    return "Connexion impossible. Vérifiez l'email et le mot de passe.";
  }

  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('fetch')
  ) {
    return import.meta.env.DEV
      ? "Connexion à Supabase impossible. Vérifiez VITE_SUPABASE_URL, la clé anon et l'accès réseau."
      : "Connexion au service impossible. Réessayez plus tard ou contactez l'administrateur.";
  }

  if (
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('not authorized') ||
    normalizedMessage.includes('42501')
  ) {
    return import.meta.env.DEV
      ? "Action refusée par Supabase. Vérifiez le rôle du professeur lié et les policies RLS."
      : "Action refusée. Si cela semble incorrect, contactez l'administrateur.";
  }

  if (
    normalizedMessage.includes('update_session_lesson_content') ||
    normalizedMessage.includes('could not find the function') ||
    normalizedMessage.includes('pgrst202')
  ) {
    return import.meta.env.DEV
      ? "La RPC Supabase de contenu pédagogique est introuvable. Exécutez supabase/rpc.sql puis relancez l'app."
      : "Le contenu du cours n'a pas pu être enregistré. Contactez l'administrateur.";
  }

  if (
    normalizedMessage.includes('notification_read_state') ||
    (normalizedMessage.includes('42p01') && normalizedMessage.includes('notification'))
  ) {
    return import.meta.env.DEV
      ? "Le suivi des notifications est absent de Supabase. Exécutez supabase/migrations/add_notification_read_state.sql."
      : "Le suivi des notifications n'est pas encore disponible. Contactez l'administrateur.";
  }

  if (normalizedMessage.includes('forum_read_state')) {
    return import.meta.env.DEV
      ? 'Le suivi des messages non lus du Forum est absent de Supabase. Exécutez supabase/migrations/add_forum_read_state.sql.'
      : "Le suivi des messages du Forum n'est pas encore disponible. Contactez l'administrateur.";
  }

  if (normalizedMessage.includes('forum_messages')) {
    return import.meta.env.DEV
      ? 'Le Forum est absent de Supabase. Exécutez supabase/migrations/add_forum_messages.sql.'
      : "Le Forum n'est pas encore disponible. Contactez l'administrateur.";
  }

  if (
    normalizedMessage.includes('no linked teacher profile') ||
    normalizedMessage.includes('aucun profil professeur') ||
    normalizedMessage.includes('no rows')
  ) {
    return import.meta.env.DEV
      ? "Le compte Supabase est connecté, mais aucun profil professeur lié n'a été trouvé. Vérifiez teachers.auth_user_id."
      : "Votre compte est connecté, mais aucun profil professeur n'est lié. Contactez l'administrateur.";
  }

  return fallback;
}
