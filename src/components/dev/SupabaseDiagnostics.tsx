import type { User } from '@supabase/supabase-js';
import type { Teacher } from '../../types';

interface SupabaseDiagnosticsProps {
  authError?: string;
  authUser: User | null;
  currentTeacher?: Teacher;
  sessionCount: number;
}

export function SupabaseDiagnostics({
  authError,
  authUser,
  currentTeacher,
  sessionCount,
}: SupabaseDiagnosticsProps) {
  if (!import.meta.env.DEV || import.meta.env.VITE_DATA_BACKEND !== 'supabase') {
    return null;
  }

  const hasSupabaseUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const hasWebPushKey = Boolean(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY);

  return (
    <details className="dev-tools supabase-diagnostics">
      <summary>Outils de diagnostic Supabase</summary>
      <dl className="diagnostic-list">
        <div>
          <dt>Backend</dt>
          <dd>supabase</dd>
        </div>
        <div>
          <dt>URL Supabase</dt>
          <dd>{hasSupabaseUrl ? 'renseignée' : 'manquante'}</dd>
        </div>
        <div>
          <dt>Clé anon</dt>
          <dd>{hasAnonKey ? 'renseignée, masquée' : 'manquante'}</dd>
        </div>
        <div>
          <dt>Clé Web Push publique</dt>
          <dd>{hasWebPushKey ? 'renseignée' : 'manquante'}</dd>
        </div>
        <div>
          <dt>Utilisateur Auth</dt>
          <dd>{authUser ? `${authUser.email ?? 'email inconnu'} (${authUser.id})` : 'non connecté'}</dd>
        </div>
        <div>
          <dt>Profil professeur</dt>
          <dd>
            {currentTeacher
              ? `${currentTeacher.name} (${currentTeacher.role}, ${currentTeacher.id})`
              : 'non résolu'}
          </dd>
        </div>
        <div>
          <dt>Cours chargés</dt>
          <dd>{sessionCount}</dd>
        </div>
      </dl>

      {!currentTeacher && authUser ? (
        <p className="diagnostic-warning">
          Aucun profil professeur lié. Vérifiez `teachers.auth_user_id` avec `supabase/verify.sql`.
        </p>
      ) : null}

      {sessionCount === 0 && currentTeacher ? (
        <p className="diagnostic-warning">
          Aucun cours chargé. Vérifiez que `supabase/seed.sql` a été exécuté et que RLS autorise la lecture.
        </p>
      ) : null}

      {authError ? <p className="diagnostic-warning">{authError}</p> : null}
    </details>
  );
}
