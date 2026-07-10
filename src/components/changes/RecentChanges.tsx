import type { ChangeLogEntry, Session, Teacher } from '../../types';
import { formatTimestamp } from '../../utils/dates';

interface RecentChangesProps {
  changes: ChangeLogEntry[];
  teachers: Teacher[];
  sessions: Session[];
  unreadChangeIds: ReadonlySet<string>;
}

export function RecentChanges({ changes, teachers, sessions, unreadChangeIds }: RecentChangesProps) {
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));

  return (
    <section className="panel changes-feed" aria-labelledby="changes-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Activité</p>
          <h2 id="changes-heading">Modifications récentes</h2>
        </div>
        <span className="count-pill">
          {unreadChangeIds.size ? `${unreadChangeIds.size} non lue${unreadChangeIds.size > 1 ? 's' : ''}` : 'À jour'}
        </span>
      </div>

      {changes.length ? (
        <div className="change-list">
          {changes.map((change) => {
            const actor = teachersById.get(change.actorTeacherId);
            const session = change.sessionId ? sessionsById.get(change.sessionId) : undefined;
            const isUnread = unreadChangeIds.has(change.id);

            return (
              <article
                key={change.id}
                className={isUnread ? 'change-item change-item--unread' : 'change-item'}
              >
                <div className="change-item__marker" aria-hidden="true" />
                <div>
                  <div className="change-item__title-row">
                    <p>{change.description}</p>
                    {isUnread ? <span className="unread-label">Non lue</span> : null}
                  </div>
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
