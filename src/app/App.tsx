import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { MainNav, type AppView } from '../components/layout/MainNav';
import { RecentChanges } from '../components/changes/RecentChanges';
import { SupabaseDiagnostics } from '../components/dev/SupabaseDiagnostics';
import { AdminCreateSessionForm } from '../components/sessions/AdminCreateSessionForm';
import { SessionCalendar } from '../components/sessions/SessionCalendar';
import { SessionDetails } from '../components/sessions/SessionDetails';
import { TeachersPage } from '../components/teachers/TeachersPage';
import { LoginScreen } from '../auth/LoginScreen';
import { useAuth } from '../auth/useAuth';
import {
  createSession,
  createTeacher,
  deleteSession,
  deleteTeacher,
  bulkUpdateAvailability,
  getDojoData,
  getDojoDataSnapshot,
  reorderTeachers,
  resetMockData,
  updateAvailability,
  updateLessonPlan,
  updateSession,
  updateTeacherRole,
} from '../data/repositories/dojoRepository';
import type {
  AvailabilityStatus,
  CreateSessionInput,
  CreateTeacherInput,
  DojoDataState,
  Teacher,
  UpdateSessionInput,
} from '../types';
import { parseLocalDate, startOfMonth } from '../utils/dates';
import { getFriendlyErrorMessage } from '../utils/errors';
import { canManageSessions } from '../utils/roles';

export function App() {
  const {
    currentTeacher,
    authUser,
    loading: authLoading,
    error: authError,
    isSupabaseMode,
    signOut,
    setLocalTeacherId,
  } = useAuth();
  const [initialData] = useState<DojoDataState>(() => getDojoDataSnapshot());
  const [data, setData] = useState<DojoDataState>(initialData);
  const [activeView, setActiveView] = useState<AppView>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(
    initialData.sessions[0]?.id,
  );
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    initialData.sessions[0]?.date,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    startOfMonth(
      parseLocalDate(initialData.sessions[0]?.date ?? new Date().toISOString().slice(0, 10)),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function applyLoadedData(nextData: DojoDataState) {
    setData(nextData);
    setSelectedSessionId((current) => {
      if (current && nextData.sessions.some((session) => session.id === current)) {
        return current;
      }

      return nextData.sessions[0]?.id;
    });
    setSelectedDate((current) => {
      if (current && nextData.sessions.some((session) => session.date === current)) {
        return current;
      }

      return nextData.sessions[0]?.date;
    });
  }

  useEffect(() => {
    if (isSupabaseMode && !currentTeacher) {
      return;
    }

    let cancelled = false;

    void getDojoData()
      .then((nextData) => {
        if (!cancelled) {
          applyLoadedData(nextData);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(getFriendlyErrorMessage(loadError, 'Impossible de charger les données.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTeacher, isSupabaseMode]);

  async function refreshData() {
    const nextData = await getDojoData();
    applyLoadedData(nextData);
    return nextData;
  }

  const selectedSession = useMemo(
    () => data.sessions.find((session) => session.id === selectedSessionId),
    [data.sessions, selectedSessionId],
  );

  const selectedAvailability = useMemo(
    () => data.availability.filter((availability) => availability.sessionId === selectedSessionId),
    [data.availability, selectedSessionId],
  );

  function handleSelectDate(date: string) {
    const sessionsForDate = data.sessions.filter((session) => session.date === date);
    setSelectedDate(date);
    setSelectedSessionId(sessionsForDate[0]?.id);
  }

  function handleSelectSession(sessionId: string) {
    const session = data.sessions.find((item) => item.id === sessionId);
    setSelectedSessionId(sessionId);

    if (session) {
      setSelectedDate(session.date);
    }
  }

async function handleSaveAvailability(status: AvailabilityStatus, comment: string) {
    if (!selectedSessionId || !currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateAvailability(selectedSessionId, currentTeacher.id, status, comment);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "La disponibilité n'a pas pu être enregistrée."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAvailabilityForTeacher(
    teacherId: string,
    status: AvailabilityStatus,
    comment: string,
  ) {
    if (!selectedSessionId || !currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateAvailability(selectedSessionId, teacherId, status, comment, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "La disponibilité n'a pas pu être enregistrée."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBulkUpdateAvailability(input: {
    targetTeacherId: string;
    sessionIds: string[];
    status: AvailabilityStatus;
    comment: string;
    overwriteExisting: boolean;
  }) {
    if (!currentTeacher) {
      return undefined;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const result = await bulkUpdateAvailability({
        ...input,
        actorTeacherId: currentTeacher.id,
      });
      await refreshData();
      return result;
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Les disponibilités n'ont pas pu être enregistrées."));
      return undefined;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLessonPlan(lessonPlan: string) {
    if (!selectedSessionId || !currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateLessonPlan(selectedSessionId, lessonPlan, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le contenu du cours n'a pas pu être enregistré."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateSession(input: CreateSessionInput) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const session = await createSession(input, currentTeacher.id);
      await refreshData();
      setSelectedSessionId(session.id);
      setSelectedDate(session.date);
      setCurrentMonth(startOfMonth(parseLocalDate(session.date)));
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le cours n'a pas pu être créé."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateSession(sessionId: string, input: UpdateSessionInput) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const session = await updateSession(sessionId, input, currentTeacher.id);
      await refreshData();
      setSelectedSessionId(session.id);
      setSelectedDate(session.date);
      setCurrentMonth(startOfMonth(parseLocalDate(session.date)));
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le cours n'a pas pu être modifié."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const deletedSession = await deleteSession(sessionId, currentTeacher.id);
      const nextData = await refreshData();
      const nextSessionForDate = nextData.sessions.find((session) => session.date === deletedSession.date);
      const nextSession = nextSessionForDate ?? nextData.sessions[0];

      setSelectedSessionId(nextSession?.id);
      setSelectedDate(nextSessionForDate ? deletedSession.date : nextSession?.date);

      if (nextSession) {
        setCurrentMonth(startOfMonth(parseLocalDate(nextSession.date)));
      }
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le cours n'a pas pu être supprimé."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTeacher(input: CreateTeacherInput) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await createTeacher(input, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le professeur n'a pas pu être ajouté."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTeacherRole(teacherId: string, role: CreateTeacherInput['role']) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await updateTeacherRole(teacherId, role, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le rôle du professeur n'a pas pu être modifié."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReorderTeachers(orderedTeacherIds: string[]) {
    if (!currentTeacher) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await reorderTeachers(orderedTeacherIds, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "L'ordre des professeurs n'a pas pu être modifié."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTeacher(teacher: Teacher) {
    if (!currentTeacher) {
      return;
    }

    const confirmed = window.confirm(`Retirer ${teacher.name} de la liste des professeurs ?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      await deleteTeacher(teacher.id, currentTeacher.id);
      await refreshData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Le professeur n'a pas pu être retiré."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetMockData() {
    setIsSaving(true);
    setError(undefined);

    try {
      const nextData = await resetMockData();
      setData(nextData);
      setSelectedSessionId(nextData.sessions[0]?.id);
      setSelectedDate(nextData.sessions[0]?.date);
      setCurrentMonth(
        startOfMonth(parseLocalDate(nextData.sessions[0]?.date ?? new Date().toISOString().slice(0, 10))),
      );
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, "Les données de test n'ont pas pu être réinitialisées."));
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading) {
    return (
      <main className="app-shell app-shell--loading">
        <p>Chargement de la session...</p>
      </main>
    );
  }

  if (isSupabaseMode && !authUser) {
    return <LoginScreen />;
  }

  if (isSupabaseMode && !currentTeacher) {
    return (
      <main className="app-shell app-shell--loading">
        <section className="panel auth-panel">
          <p className="eyebrow">Profil professeur</p>
          <h1>Accès impossible</h1>
          <p>{authError ?? "Aucun profil professeur n'est lié à ce compte. Contactez l'administrateur."}</p>
          <button className="primary-button" type="button" onClick={() => void signOut()}>
            Se déconnecter
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader
        teachers={data.teachers}
        currentTeacher={currentTeacher}
        isSupabaseMode={isSupabaseMode}
        onChangeTeacher={setLocalTeacherId}
        onSignOut={() => void signOut()}
      />
      <MainNav activeView={activeView} onChangeView={setActiveView} />

      {error ? <p className="error-banner">{error}</p> : null}

      {activeView === 'sessions' ? (
        <main className="calendar-layout">
          <div className="calendar-main">
            <SessionCalendar
              sessions={data.sessions}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              selectedSessionId={selectedSessionId}
              onChangeMonth={setCurrentMonth}
              onSelectDate={handleSelectDate}
              onSelectSession={handleSelectSession}
            />
            {canManageSessions(currentTeacher) ? (
              <AdminCreateSessionForm
                selectedSession={selectedSession}
                isSaving={isSaving}
                onCreateSession={handleCreateSession}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
              />
            ) : null}
          </div>
          <SessionDetails
            session={selectedSession}
            sessions={data.sessions}
            teachers={data.teachers}
            availability={selectedAvailability}
            allAvailability={data.availability}
            currentTeacher={currentTeacher}
            isSaving={isSaving}
            onSaveAvailability={handleSaveAvailability}
            onSaveAvailabilityForTeacher={handleSaveAvailabilityForTeacher}
            onBulkUpdateAvailability={handleBulkUpdateAvailability}
            onSaveLessonPlan={handleSaveLessonPlan}
          />
        </main>
      ) : null}

      {activeView === 'changes' ? (
        <main>
          <RecentChanges changes={data.changes} teachers={data.teachers} sessions={data.sessions} />
        </main>
      ) : null}

      {activeView === 'teachers' ? (
        <main>
          <TeachersPage
            teachers={data.teachers}
            currentTeacher={currentTeacher}
            isSaving={isSaving}
            onCreateTeacher={handleCreateTeacher}
            onUpdateTeacherRole={handleUpdateTeacherRole}
            onReorderTeachers={handleReorderTeachers}
            onDeleteTeacher={handleDeleteTeacher}
          />
        </main>
      ) : null}

      <footer className="app-footer">
        <SupabaseDiagnostics
          authError={authError}
          authUser={authUser}
          currentTeacher={currentTeacher}
          sessionCount={data.sessions.length}
        />
        {!isSupabaseMode && import.meta.env.DEV ? (
          <details className="dev-tools">
            <summary>Outils de développement</summary>
            <p>Données locales de test. Ce contrôle n'est pas une action normale du dojo.</p>
            <button className="text-button" type="button" onClick={handleResetMockData} disabled={isSaving}>
              Réinitialiser les données de test
            </button>
          </details>
        ) : null}
      </footer>
    </div>
  );
}
