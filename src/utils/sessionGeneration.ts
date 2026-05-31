import { recurringLessonTemplates } from '../data/recurringSchedule';
import { isHolidayDate } from '../data/holidayCalendar';
import { activeDojoSeason, type DojoSeason } from '../data/seasonConfig';
import type { Session } from '../types';
import { addDays, parseLocalDate, startOfWeek, toISODate } from './dates';

const generatedAt = '2026-05-26T08:00:00.000Z';

export function generateRecurringSessions(startDate = new Date(), weekCount = 10): Session[] {
  const firstMonday = startOfWeek(startDate);
  const firstVisibleDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const sessions: Session[] = [];

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    for (const template of recurringLessonTemplates) {
      const sessionDate = addDays(firstMonday, weekIndex * 7 + (template.dayOfWeek - 1));

      if (sessionDate < firstVisibleDate) {
        continue;
      }

      const date = toISODate(sessionDate);

      if (isHolidayDate(date)) {
        continue;
      }

      sessions.push({
        id: `session-${date}-${template.id}`,
        title: template.title,
        date,
        startTime: template.startTime,
        endTime: template.endTime,
        location: template.location,
        lessonPlan: '',
        notes: template.notes ?? '',
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    }
  }

  return sessions;
}

export function generateSeasonSessions(season: DojoSeason = activeDojoSeason): Session[] {
  const firstMonday = startOfWeek(parseLocalDate(season.seasonStartDate));
  const seasonStart = parseLocalDate(season.seasonStartDate);
  const seasonEnd = parseLocalDate(season.seasonEndDate);
  const sessions: Session[] = [];

  for (let day = firstMonday; day <= seasonEnd; day = addDays(day, 7)) {
    for (const template of recurringLessonTemplates) {
      const sessionDate = addDays(day, template.dayOfWeek - 1);

      if (sessionDate < seasonStart || sessionDate > seasonEnd) {
        continue;
      }

      const date = toISODate(sessionDate);

      if (isHolidayDate(date)) {
        continue;
      }

      sessions.push({
        id: `session-${date}-${template.id}`,
        title: template.title,
        date,
        startTime: template.startTime,
        endTime: template.endTime,
        location: template.location,
        lessonPlan: '',
        notes: template.notes ?? '',
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    }
  }

  return sessions;
}
