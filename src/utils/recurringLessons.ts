import { recurringLessonTemplates } from '../data/recurringSchedule';
import type { Session } from '../types';
import { toISODate } from './dates';

export const recurringLessonTitles = [...new Set(recurringLessonTemplates.map((template) => template.title))].sort(
  (left, right) => left.localeCompare(right, 'fr'),
);

export function isRecurringLessonSession(session: Pick<Session, 'date' | 'title' | 'startTime' | 'endTime'>) {
  const weekday = new Date(`${session.date}T00:00:00`).getDay();
  return recurringLessonTemplates.some(
    (template) =>
      template.dayOfWeek === weekday &&
      template.title === session.title &&
      template.startTime === session.startTime &&
      template.endTime === session.endTime,
  );
}

export function getRecurringLessonDateBounds(sessions: Session[], today = toISODate(new Date())) {
  const recurringSessions = sessions
    .filter(isRecurringLessonSession)
    .slice()
    .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`));
  const firstDate = recurringSessions[0]?.date ?? '';
  const lastDate = recurringSessions.at(-1)?.date ?? '';
  const firstUpcomingDate = recurringSessions.find((session) => session.date >= today)?.date;

  return {
    firstDate,
    lastDate,
    defaultStartDate: firstUpcomingDate ?? firstDate,
    defaultEndDate: lastDate,
  };
}
