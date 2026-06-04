import type { Session } from '../../types';
import { formatDateLabel, formatTimeRange } from '../../utils/dates';

interface SessionListProps {
  sessions: Session[];
  selectedSessionId: string | undefined;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, selectedSessionId, onSelectSession }: SessionListProps) {
  return (
    <section className="panel sessions-list" aria-labelledby="sessions-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">À venir</p>
          <h2 id="sessions-heading">Cours</h2>
        </div>
        <span className="count-pill">{sessions.length}</span>
      </div>

      <div className="session-stack">
        {sessions.map((session, index) => {
          const shouldShowDate = sessions[index - 1]?.date !== session.date;
          const hasLessonContent = Boolean(session.lessonPlan?.trim() || session.notes?.trim());

          return (
            <div key={session.id} className="session-group">
              {shouldShowDate ? <h3 className="date-divider">{formatDateLabel(session.date)}</h3> : null}
              <button
                className={selectedSessionId === session.id ? 'session-card session-card--active' : 'session-card'}
                type="button"
                onClick={() => onSelectSession(session.id)}
              >
                <span>
                  <strong>{session.title}</strong>
                  <small>{formatTimeRange(session.startTime, session.endTime)}</small>
                </span>
                <span className="session-card__meta">
                  {session.location ? session.location : 'Lieu non renseigné'}
                </span>
                <span className={hasLessonContent ? 'lesson-state' : 'lesson-state lesson-state--empty'}>
                  {hasLessonContent ? 'Contenu prêt' : 'Aucun contenu'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
