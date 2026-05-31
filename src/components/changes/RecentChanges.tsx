import type { ChangeLogEntry, Session, Teacher } from '../../types';
import { formatTimestamp } from '../../utils/dates';

interface RecentChangesProps {
  changes: ChangeLogEntry[];
  teachers: Teacher[];
  sessions: Session[];
}

export function RecentChanges({ changes, teachers, sessions }: RecentChangesProps) {
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));

  return (
    <section className="panel changes-feed" aria-labelledby="changes-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Activité</p>
          <h2 id="changes-heading">Modifications récentes</h2>
        </div>
        <span className="count-pill">{changes.length}</span>
      </div>

      {changes.length ? (
        <div className="change-list">
          {changes.map((change) => {
          const actor = teachersById.get(change.actorTeacherId);
          const session = change.sessionId ? sessionsById.get(change.sessionId) : undefined;

          return (
            <article key={change.id} className="change-item">
              <div className="change-item__marker" aria-hidden="true" />
              <div>
                <p>{change.description}</p>
                <small>
                  {actor?.name ?? 'Professeur inconnu'}
                  {session ? ` · ${session.title}` : ''} · {formatTimestamp(change.createdAt)}
                </small>
              </div>
            </article>
          );
          })}
        </div>
      ) : (
        <p className="empty-state empty-state--panel">
          Aucune modification récente pour le moment.
        </p>
      )}
    </section>
  );
}
