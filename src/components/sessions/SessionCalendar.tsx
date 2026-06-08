import type { Session } from '../../types';
import { getHolidayInfo } from '../../data/holidayCalendar';
import {
  addDays,
  addMonths,
  endOfMonth,
  formatMonthTitle,
  formatTimeRange,
  parseLocalDate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from '../../utils/dates';

const weekdayLabels = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

interface SessionCalendarProps {
  sessions: Session[];
  currentMonth: Date;
  selectedDate: string | undefined;
  selectedSessionId: string | undefined;
  onChangeMonth: (month: Date) => void;
  onSelectDate: (date: string) => void;
  onSelectSession: (sessionId: string) => void;
}

export function SessionCalendar({
  sessions,
  currentMonth,
  selectedDate,
  selectedSessionId,
  onChangeMonth,
  onSelectDate,
  onSelectSession,
}: SessionCalendarProps) {
  const sessionsByDate = groupSessionsByDate(sessions);
  const calendarDays = getCalendarDays(currentMonth);
  const today = toISODate(new Date());
  const selectedDaySessions = selectedDate ? sessionsByDate.get(selectedDate) ?? [] : [];
  const selectedHoliday = selectedDate ? getHolidayInfo(selectedDate) : undefined;

  return (
    <section className="panel calendar-panel" aria-labelledby="calendar-heading">
      <div className="panel-heading calendar-heading">
        <div>
          <p className="eyebrow">Calendrier</p>
          <h2 id="calendar-heading">{formatMonthTitle(currentMonth)}</h2>
        </div>
        <div className="calendar-actions" aria-label="Changer de mois">
          <button type="button" className="icon-button" onClick={() => onChangeMonth(addMonths(currentMonth, -1))}>
            Précédent
          </button>
          <button type="button" className="icon-button" onClick={() => onChangeMonth(addMonths(new Date(), 0))}>
            Aujourd'hui
          </button>
          <button type="button" className="icon-button" onClick={() => onChangeMonth(addMonths(currentMonth, 1))}>
            Suivant
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label="Calendrier des cours">
        {weekdayLabels.map((label) => (
          <div key={label} className="weekday-label" role="columnheader">
            {label}
          </div>
        ))}

        {calendarDays.map((day) => {
          const date = toISODate(day);
          const daySessions = sessionsByDate.get(date) ?? [];
          const holiday = getHolidayInfo(date);
          const isSelected = selectedDate === date;
          const isOutsideMonth = day.getMonth() !== currentMonth.getMonth();
          const isPast = date < today;
          const isToday = date === today;

          return (
            <button
              key={date}
              type="button"
              aria-current={isToday ? 'date' : undefined}
              className={[
                'calendar-day',
                isSelected ? 'calendar-day--selected' : '',
                isOutsideMonth ? 'calendar-day--muted' : '',
                daySessions.length ? 'calendar-day--has-sessions' : '',
                holiday ? 'calendar-day--holiday' : '',
                isPast ? 'calendar-day--past' : '',
                isToday ? 'calendar-day--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
            >
              <span className="calendar-day__number">{day.getDate()}</span>
              {holiday ? (
                <span className="calendar-holiday-label">
                  {holiday.isPublicHoliday ? 'Férié' : 'Vacances'}
                </span>
              ) : null}
              <span className="calendar-day__sessions">
                {daySessions.slice(0, 2).map((session) => (
                  <span key={session.id} className="calendar-session-dot">
                    {session.startTime.replace(':', 'h')}
                  </span>
                ))}
                {daySessions.length > 2 ? (
                  <span className="calendar-session-dot">+{daySessions.length - 2} autre</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="day-session-picker selected-day-agenda">
        <div>
          <p className="eyebrow">Cours du jour sélectionné</p>
          <h3>{selectedDate ? selectedDateLabel(selectedDate) : 'Aucune date sélectionnée'}</h3>
          {selectedHoliday ? (
            <p className="holiday-notice">
              <strong>
                {selectedHoliday.isPublicHoliday
                  ? 'Jour férié'
                  : selectedHoliday.isBridgeDay
                    ? 'Cours suspendus'
                    : 'Vacances scolaires'}
              </strong>
              {' · '}
              {selectedHoliday.labels.join(' · ')}
            </p>
          ) : null}
          <p className="agenda-helper">
            {selectedDaySessions.length
              ? `${selectedDaySessions.length} cours prévu${selectedDaySessions.length > 1 ? 's' : ''} ce jour-là.`
              : selectedHoliday
                ? 'Aucun cours prévu — cours suspendus.'
                : 'Sélectionnez une autre date dans le calendrier pour voir les cours prévus.'}
          </p>
        </div>

        {selectedDaySessions.length ? (
          <div className="day-session-buttons" aria-label="Cours de la date sélectionnée">
            {selectedDaySessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={
                  selectedSessionId === session.id
                    ? 'day-session-button day-session-button--active'
                    : 'day-session-button'
                }
                onClick={() => onSelectSession(session.id)}
              >
                <strong>{session.title}</strong>
                <span>{formatTimeRange(session.startTime, session.endTime)}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-state empty-state--agenda">
            {selectedHoliday
              ? `Aucun cours prévu — ${selectedHoliday.labels.join(' · ')}.`
              : 'Aucun cours prévu ce jour-là.'}
          </p>
        )}
      </div>
    </section>
  );
}

function groupSessionsByDate(sessions: Session[]) {
  const sessionsByDate = new Map<string, Session[]>();

  for (const session of sessions) {
    const currentSessions = sessionsByDate.get(session.date) ?? [];
    sessionsByDate.set(session.date, [...currentSessions, session]);
  }

  return sessionsByDate;
}

function getCalendarDays(currentMonth: Date) {
  const firstVisibleDay = startOfWeek(startOfMonth(currentMonth));
  const lastMonthDay = endOfMonth(currentMonth);
  const lastVisibleDay = addDays(startOfWeek(lastMonthDay), 6);
  const days: Date[] = [];

  for (let day = firstVisibleDay; day <= lastVisibleDay; day = addDays(day, 1)) {
    days.push(day);
  }

  return days;
}

function selectedDateLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseLocalDate(date));
}
