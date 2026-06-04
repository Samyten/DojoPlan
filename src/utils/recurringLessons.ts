import { recurringLessonTemplates } from '../data/recurringSchedule';
import type { Session } from '../types';

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
