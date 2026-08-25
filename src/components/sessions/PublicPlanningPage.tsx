import { useEffect, useState } from 'react';
import { getPublicSessions } from '../../data/repositories/dojoRepository';
import type { PublicSession } from '../../types';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { startOfMonth, toISODate } from '../../utils/dates';
import { InstallAppPrompt } from '../pwa/InstallAppPrompt';
import { SessionCalendar } from './SessionCalendar';

interface PublicPlanningPageProps {
  onBackToLogin: () => void;
}

export function PublicPlanningPage({ onBackToLogin }: PublicPlanningPageProps) {
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    void getPublicSessions()
      .then((loadedSessions) => {
        if (!cancelled) {
          setSessions(loadedSessions);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            getFriendlyErrorMessage(loadError, "Le planning public n'a pas pu être chargé."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    const firstSession = sessions.find((session) => session.date === date);
    setSelectedSessionId(firstSession?.id);
  }

  return (
    <div className="app-shell public-planning-shell">
      <header className="public-planning-header">
        <div className="public-planning-brand">
          <img
            src="/logo-karate-nanbu-saint-esteve.png"
            alt="Karaté Nanbu Saint-Estève"
          />
          <div>
            <p className="eyebrow">Accès public</p>
            <h1>Planning des cours</h1>
            <p>Calendrier en lecture seule du Karaté Nanbu Saint-Estève.</p>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={onBackToLogin}>
          Retour à la connexion
        </button>
      </header>

      {error ? <p className="error-banner">{error}</p> : null}
      {isLoading ? <p className="public-planning-loading">Chargement du planning...</p> : null}

      {!isLoading && !error ? (
        <main className="public-calendar-layout">
          <SessionCalendar
            sessions={sessions}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            selectedSessionId={selectedSessionId}
            onChangeMonth={setCurrentMonth}
            onSelectDate={handleSelectDate}
            onSelectSession={setSelectedSessionId}
          />
        </main>
      ) : null}

      <footer className="app-footer">
        <InstallAppPrompt />
      </footer>
    </div>
  );
}
