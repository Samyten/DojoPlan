import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader';
import { MainNav, type AppView } from '../components/layout/MainNav';
import { RecentChanges } from '../components/changes/RecentChanges';
import { SupabaseDiagnostics } from '../components/dev/SupabaseDiagnostics';
import { AdminCreateSessionForm } from '../components/sessions/AdminCreateSessionForm';
import { SessionCalendar } from '../components/sessions/SessionCalendar';
import { SessionDetails } from '../components/sessions/SessionDetails';
import { TeachersPage } from '../components/teachers/TeachersPage';
import { ForumPage } from '../components/forum/ForumPage';
import { InstallAppPrompt } from '../components/pwa/InstallAppPrompt';
import { NotificationPrompt } from '../components/pwa/NotificationPrompt';
import { LoginScreen } from '../auth/LoginScreen';
import { useAuth } from '../auth/useAuth';
import {
  createSession,
  createForumMessage,
  createTeacher,
  deleteSession,
  deleteTeacher,
  bulkUpdateAvailability,
  getDojoData,
  getDojoDataSnapshot,
  getForumMessages,
  getForumReadAt,
  getNotificationReadAt,
  markForumRead,
  markNotificationsRead,
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
  ForumMessage,
  Teacher,
  UpdateSessionInput,
} from '../types';
import { parseLocalDate, startOfMonth } from '../utils/dates';
import { getFriendlyErrorMessage } from '../utils/errors';
import { canManageSessions } from '../utils/roles';

const appViews: AppView[] = ['sessions', 'changes', 'teachers', 'forum'];

function getInitialAppView(): AppView {
  const requestedView = new URLSearchParams(window.location.search).get('view');
  return appViews.includes(requestedView as AppView) ? (requestedView as AppView) : 'sessions';
}

function updateViewUrl(view: AppView) {
  const url = new URL(window.location.href);

  if (view === 'sessions') {
    url.searchParams.delete('view');
  } else {
    url.searchParams.set('view', view);
  }

  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

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
  const [activeView, setActiveView] = useState<AppView>(getInitialAppView);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notificationReadAt, setNotificationReadAt] = useState<string | undefined>();
  const [notificationReadTeacherId, setNotificationReadTeacherId] = useState<string | undefined>();
  const [visibleUnreadChangeIds, setVisibleUnreadChangeIds] = useState<Set<string>>(() => new Set());
  const [forumMessages, setForumMessages] = useState<ForumMessage[]>([]);
  const [isForumLoading, setIsForumLoading] = useState(false);
  const [isForumSending, setIsForumSending] = useState(false);
  const [forumError, setForumError] = useState<string | undefined>();
  const [forumReadAt, setForumReadAt] = useState<string | undefined>();
  const [forumReadTeacherId, setForumReadTeacherId] = useState<string | undefined>();
  const [visibleUnreadForumMessageIds, setVisibleUnreadForumMessageIds] = useState<Set<string>>(
    () => new Set(),
  );

  function applyLoadedData(nextData: DojoDataState) {
    setData(nextData);
    setSelectedSessionId((current) => {
      if (current && nextData.sessions.some((session) => session.id === current)) {
        return current;
      }

      return undefined;
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

  useEffect(() => {
    if (!currentTeacher) {
      return;
    }

    let cancelled = false;

    void getNotificationReadAt(currentTeacher.id)
      .then((readAt) => {
        if (!cancelled) {
          setNotificationReadAt(readAt);
          setNotificationReadTeacherId(currentTeacher.id);
        }
      })
      .catch((readError: unknown) => {
        if (!cancelled) {
          setError(
            getFriendlyErrorMessage(
              readError,
              "Le suivi des notifications n'a pas pu être chargé.",
            ),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTeacher]);

  useEffect(() => {
    if (!currentTeacher) {
      return;
    }

    let cancelled = false;
    void Promise.all([getForumMessages(), getForumReadAt(currentTeacher.id)])
      .then(([messages, readAt]) => {
        if (!cancelled) {
          setVisibleUnreadForumMessageIds(new Set());
          setForumMessages(messages);
          setForumReadAt(readAt);
          setForumReadTeacherId(currentTeacher.id);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setForumError(
            getFriendlyErrorMessage(
              loadError,
              "Les notifications du Forum n'ont pas pu être chargées.",
            ),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTeacher]);

  async function refreshData() {
    const nextData = await getDojoData();
    applyLoadedData(nextData);
    return nextData;
  }

  async function refreshForumMessages(markVisibleMessagesAsRead = false) {
    setIsForumLoading(true);
    setForumError(undefined);

    try {
      const [messages, readAt] = await Promise.all([
        getForumMessages(),
        currentTeacher ? getForumReadAt(currentTeacher.id) : Promise.resolve(undefined),
      ]);
      setForumMessages(messages);

      if (currentTeacher) {
        setForumReadAt(readAt);
        setForumReadTeacherId(currentTeacher.id);
      }

      if (markVisibleMessagesAsRead && currentTeacher) {
        const unreadMessages = messages.filter(
          (message) => !readAt || message.createdAt > readAt,
        );
        setVisibleUnreadForumMessageIds(new Set(unreadMessages.map((message) => message.id)));

        const latestMessageAt = messages.reduce<string | undefined>(
          (latest, message) =>
            !latest || message.createdAt > latest ? message.createdAt : latest,
          undefined,
        );

        if (latestMessageAt && unreadMessages.length) {
          const savedReadAt = await markForumRead(currentTeacher.id, latestMessageAt);
          setForumReadAt(savedReadAt);
        }
      }
    } catch (loadError) {
      setForumError(
        getFriendlyErrorMessage(loadError, "Les messages du Forum n'ont pas pu être chargés."),
      );
    } finally {
      setIsForumLoading(false);
    }
  }

  const selectedSession = useMemo(
    () => data.sessions.find((session) => session.id === selectedSessionId),
    [data.sessions, selectedSessionId],
  );

  const selectedAvailability = useMemo(
    () => data.availability.filter((availability) => availability.sessionId === selectedSessionId),
    [data.availability, selectedSessionId],
  );

  const unreadChanges = useMemo(() => {
    if (!currentTeacher || notificationReadTeacherId !== currentTeacher.id) {
      return [];
    }

    return data.changes.filter(
      (change) => !notificationReadAt || change.createdAt > notificationReadAt,
    );
  }, [currentTeacher, data.changes, notificationReadAt, notificationReadTeacherId]);

  const unreadForumMessages = useMemo(() => {
    if (!currentTeacher || forumReadTeacherId !== currentTeacher.id) {
      return [];
    }

    return forumMessages.filter(
      (message) => !forumReadAt || message.createdAt > forumReadAt,
    );
  }, [currentTeacher, forumMessages, forumReadAt, forumReadTeacherId]);

  function handleChangeView(view: AppView) {
    setActiveView(view);
    updateViewUrl(view);

    if (view !== 'changes') {
      setVisibleUnreadChangeIds(new Set());
    }

    if (view !== 'forum') {
      setVisibleUnreadForumMessageIds(new Set());
    }

    if (view === 'forum') {
      void refreshForumMessages(true);
      return;
    }

    if (view !== 'changes') {
      return;
    }

    setVisibleUnreadChangeIds(new Set(unreadChanges.map((change) => change.id)));

    const latestChangeAt = data.changes.reduce<string | undefined>(
      (latest, change) => (!latest || change.createdAt > latest ? change.createdAt : latest),
      undefined,
    );

    if (!currentTeacher || !latestChangeAt || !unreadChanges.length) {
      return;
    }

    void markNotificationsRead(currentTeacher.id, latestChangeAt)
      .then(setNotificationReadAt)
      .catch((readError: unknown) => {
        setError(
          getFriendlyErrorMessage(
            readError,
            "Les notifications n'ont pas pu être marquées comme lues.",
          ),
        );
      });
  }

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

  async function handleSendForumMessage(message: string) {
    if (!currentTeacher) {
      return false;
    }

    setIsForumSending(true);
    setForumError(undefined);

    try {
      const createdMessage = await createForumMessage(message, currentTeacher.id);
      setForumMessages((current) =>
        [...current.filter((item) => item.id !== createdMessage.id), createdMessage].sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        ),
      );
      void markForumRead(currentTeacher.id, createdMessage.createdAt)
        .then((readAt) => {
          setForumReadAt(readAt);
          setForumReadTeacherId(currentTeacher.id);
        })
        .catch((readError: unknown) => {
          setForumError(
            getFriendlyErrorMessage(
              readError,
              "Le message a été envoyé, mais son état de lecture n'a pas pu être enregistré.",
            ),
          );
        });
      return true;
    } catch (saveError) {
      setForumError(
        getFriendlyErrorMessage(saveError, "Le message n'a pas pu être envoyé."),
      );
      return false;
    } finally {
      setIsForumSending(false);
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
      setForumMessages([]);
      setForumReadAt(undefined);
      setForumReadTeacherId(undefined);
      setVisibleUnreadForumMessageIds(new Set());
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
      <MainNav
        activeView={activeView}
        unreadChangeCount={unreadChanges.length}
        unreadForumCount={unreadForumMessages.length}
        onChangeView={handleChangeView}
      />

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
          <RecentChanges
            changes={data.changes}
            teachers={data.teachers}
            sessions={data.sessions}
            unreadChangeIds={visibleUnreadChangeIds}
          />
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

      {activeView === 'forum' ? (
        <main>
          <ForumPage
            messages={forumMessages}
            unreadMessageIds={visibleUnreadForumMessageIds}
            currentTeacher={currentTeacher}
            isLoading={isForumLoading}
            isSending={isForumSending}
            error={forumError}
            onRefresh={() => refreshForumMessages(true)}
            onSendMessage={handleSendForumMessage}
          />
        </main>
      ) : null}

      <footer className="app-footer">
        <InstallAppPrompt />
        <NotificationPrompt currentTeacher={currentTeacher} isSupabaseMode={isSupabaseMode} />
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
