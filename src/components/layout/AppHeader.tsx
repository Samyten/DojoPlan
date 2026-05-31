import type { Teacher } from '../../types';
import { roleLabel } from '../../utils/roles';

interface AppHeaderProps {
  teachers: Teacher[];
  currentTeacher: Teacher | undefined;
  isSupabaseMode: boolean;
  onChangeTeacher: (teacherId: string) => void;
  onSignOut: () => void;
}

export function AppHeader({
  teachers,
  currentTeacher,
  isSupabaseMode,
  onChangeTeacher,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img
          className="dojo-logo"
          src="/logo-karate-nanbu-saint-esteve.png"
          alt="Karaté Nanbu Saint-Estève"
        />
        <div>
          <p className="eyebrow">Karaté Nanbu Saint-Estève</p>
          <h1>Planning du dojo</h1>
        </div>
      </div>

      {isSupabaseMode ? (
        <div className="user-switcher user-switcher--readonly">
          <span>Compte connecté</span>
          <strong>{currentTeacher?.name ?? 'Profil professeur manquant'}</strong>
          <small>{currentTeacher ? roleLabel(currentTeacher.role) : 'profil manquant'}</small>
          <button className="text-button" type="button" onClick={onSignOut}>
            Se déconnecter
          </button>
        </div>
      ) : (
        <label className="user-switcher">
          <span>Utilisateur actuel (mode local / développement)</span>
          <select value={currentTeacher?.id ?? ''} onChange={(event) => onChangeTeacher(event.target.value)}>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({roleLabel(teacher.role)})
              </option>
            ))}
          </select>
        </label>
      )}
    </header>
  );
}
