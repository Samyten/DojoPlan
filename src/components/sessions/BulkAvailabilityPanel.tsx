import { useMemo, useState, type FormEvent } from 'react';
import type {
  Availability,
  AvailabilityStatus,
  BulkAvailabilityResult,
  Session,
  Teacher,
} from '../../types';
import { formatLongDate } from '../../utils/dates';
import { isRecurringLessonSession, recurringLessonTitles } from '../../utils/recurringLessons';
import { canManageSessions } from '../../utils/roles';

const statusOptions: AvailabilityStatus[] = ['present', 'absent', 'maybe', 'unknown'];

const statusLabels: Record<AvailabilityStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  maybe: 'Peut-être',
  unknown: 'Non renseigné',
};

const weekdays = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

interface BulkAvailabilityPanelProps {
  sessions: Session[];
  availability: Availability[];
  teachers: Teacher[];
  currentTeacher: Teacher;
  isSaving: boolean;
  onBulkUpdateAvailability: (input: {
    targetTeacherId: string;
    sessionIds: string[];
    status: AvailabilityStatus;
    comment: string;
    overwriteExisting: boolean;
  }) => Promise<BulkAvailabilityResult | undefined>;
}

export function BulkAvailabilityPanel({
  sessions,
  availability,
  teachers,
  currentTeacher,
  isSaving,
  onBulkUpdateAvailability,
}: BulkAvailabilityPanelProps) {
  const upcomingSessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions.filter((session) => session.date >= today);
  }, [sessions]);
  const defaultStartDate = upcomingSessions[0]?.date ?? sessions[0]?.date ?? '';
  const defaultEndDate = upcomingSessions.at(-1)?.date ?? sessions.at(-1)?.date ?? '';
  const [targetTeacherId, setTargetTeacherId] = useState(currentTeacher.id);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 4]);
  const [lessonType, setLessonType] = useState('all');
  const [status, setStatus] = useState<AvailabilityStatus>('absent');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const canTargetOthers = canManageSessions(currentTeacher);
  const effectiveTargetTeacherId = canTargetOthers ? targetTeacherId : currentTeacher.id;
  const targetTeacher = teachers.find((teacher) => teacher.id === effectiveTargetTeacherId) ?? currentTeacher;
  const availabilityBySessionForTarget = useMemo(
    () =>
      new Map(
        availability
          .filter((item) => item.teacherId === effectiveTargetTeacherId)
          .map((item) => [item.sessionId, item]),
      ),
    [availability, effectiveTargetTeacherId],
  );
  const matchingSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const weekday = new Date(`${session.date}T00:00:00`).getDay();
        return (
          isRecurringLessonSession(session) &&
          (!startDate || session.date >= startDate) &&
          (!endDate || session.date <= endDate) &&
          selectedWeekdays.includes(weekday) &&
          (lessonType === 'all' || session.title === lessonType)
        );
      }),
    [endDate, lessonType, selectedWeekdays, sessions, startDate],
  );
  const updatableSessions = matchingSessions.filter((session) => {
    const existing = availabilityBySessionForTarget.get(session.id);
    const hasExplicitExisting = Boolean(existing) && existing?.status !== 'unknown';

    return overwriteExisting || !hasExplicitExisting;
  });
  const skippedCount = matchingSessions.length - updatableSessions.length;
  const selectedWeekdayLabels = weekdays
    .filter((weekday) => selectedWeekdays.includes(weekday.value))
    .map((weekday) => weekday.label.toLowerCase())
    .join(', ');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setResultMessage(undefined);

    if (!updatableSessions.length) {
      setError('Aucun cours ne correspond aux critères sélectionnés.');
      return;
    }

    if (
      overwriteExisting &&
      !window.confirm(
        'Des disponibilités déjà renseignées seront remplacées. Continuer ?',
      )
    ) {
      return;
    }

    const result = await onBulkUpdateAvailability({
      targetTeacherId: effectiveTargetTeacherId,
      sessionIds: updatableSessions.map((session) => session.id),
      status,
      comment: '',
      overwriteExisting,
    });

    if (result) {
      setResultMessage(`${result.updatedCount} disponibilités ont été mises à jour.`);
    }
  }

  return (
    <details className="secondary-details">
      <summary>Renseigner plusieurs disponibilités</summary>
      <form className="bulk-availability-form" onSubmit={handleSubmit}>
        {canTargetOthers ? (
          <label className="field">
            <span>Professeur concerné</span>
            <select value={targetTeacherId} onChange={(event) => setTargetTeacherId(event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                {teacher.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="form-context">Disponibilités pour {currentTeacher.name}.</p>
        )}

        <div className="form-grid">
          <label className="field">
            <span>Du</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Au</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Type de cours</span>
            <select value={lessonType} onChange={(event) => setLessonType(event.target.value)}>
              <option value="all">Tous les cours</option>
              {recurringLessonTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="weekday-options">
          <legend>Jours</legend>
          {weekdays.map((weekday) => (
            <label key={weekday.value}>
              <input
                type="checkbox"
                checked={selectedWeekdays.includes(weekday.value)}
                onChange={(event) => {
                  setSelectedWeekdays((current) =>
                    event.target.checked
                      ? [...current, weekday.value]
                      : current.filter((value) => value !== weekday.value),
                  );
                }}
              />
              <span>{weekday.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="status-options">
          <legend>Statut à appliquer</legend>
          {statusOptions.map((option) => (
            <label key={option} className="status-option">
              <input
                name="bulkStatus"
                type="radio"
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
              />
              <span>{statusLabels[option]}</span>
            </label>
          ))}
        </fieldset>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={overwriteExisting}
            onChange={(event) => setOverwriteExisting(event.target.checked)}
          />
          <span>Remplacer également les disponibilités déjà renseignées</span>
        </label>

        <div className="muted-box">
          <p>
            {updatableSessions.length} cours seront mis à jour pour {targetTeacher.name}.
          </p>
          <small>
            {startDate ? formatLongDate(startDate) : 'Date de début non renseignée'} →{' '}
            {endDate ? formatLongDate(endDate) : 'date de fin non renseignée'} · {selectedWeekdayLabels || 'aucun jour'} ·{' '}
            {lessonType === 'all' ? 'tous les cours' : lessonType}
            {skippedCount > 0 ? ` · ${skippedCount} déjà renseignés ignorés` : ''}
          </small>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {resultMessage ? <p className="success-banner">{resultMessage}</p> : null}

        <button className="primary-button" type="submit" disabled={isSaving || !updatableSessions.length}>
          {isSaving ? 'Application...' : 'Appliquer aux cours sélectionnés'}
        </button>
      </form>
    </details>
  );
}
