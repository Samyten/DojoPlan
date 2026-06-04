import { describe, expect, it } from 'vitest';
import { recurringLessonTemplates } from '../data/recurringSchedule';
import { activeDojoSeason } from '../data/seasonConfig';
import { isRecurringLessonSession, recurringLessonTitles } from './recurringLessons';
import { generateRecurringSessions, generateSeasonSessions } from './sessionGeneration';

describe('recurring lesson schedule', () => {
  it('uses the real dojo labels and times', () => {
    expect(recurringLessonTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dayOfWeek: 1,
          title: 'Enfants 10 à 14 ans',
          startTime: '18:00',
          endTime: '19:15',
        }),
        expect.objectContaining({
          dayOfWeek: 1,
          title: 'Adultes',
          startTime: '19:15',
          endTime: '20:30',
        }),
        expect.objectContaining({
          dayOfWeek: 1,
          title: 'Karaté Contact',
          startTime: '20:30',
          endTime: '21:30',
        }),
        expect.objectContaining({
          dayOfWeek: 3,
          title: 'Enfants de 5 à 9 ans',
          startTime: '17:15',
          endTime: '18:30',
        }),
        expect.objectContaining({
          dayOfWeek: 4,
          title: 'Enfants 10 à 14 ans',
          startTime: '18:00',
          endTime: '19:15',
        }),
        expect.objectContaining({
          dayOfWeek: 4,
          title: 'Adultes',
          startTime: '19:15',
          endTime: '20:30',
        }),
        expect.objectContaining({
          dayOfWeek: 4,
          title: 'Karaté Contact',
          startTime: '20:30',
          endTime: '21:30',
        }),
      ]),
    );
  });

  it('includes Karaté Contact on Mondays and Thursdays', () => {
    expect(recurringLessonTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dayOfWeek: 1,
          title: 'Karaté Contact',
          startTime: '20:30',
          endTime: '21:30',
        }),
        expect.objectContaining({
          dayOfWeek: 4,
          title: 'Karaté Contact',
          startTime: '20:30',
          endTime: '21:30',
        }),
      ]),
    );
  });
});

describe('generateRecurringSessions', () => {
  it('generates the real weekly lessons outside holidays', () => {
    const sessions = generateRecurringSessions(new Date(2026, 5, 8), 1);

    expect(sessions.map((session) => `${session.date} ${session.startTime} ${session.title}`)).toEqual([
      '2026-06-08 18:00 Enfants 10 à 14 ans',
      '2026-06-08 19:15 Adultes',
      '2026-06-08 20:30 Karaté Contact',
      '2026-06-10 17:15 Enfants de 5 à 9 ans',
      '2026-06-11 18:00 Enfants 10 à 14 ans',
      '2026-06-11 19:15 Adultes',
      '2026-06-11 20:30 Karaté Contact',
    ]);
  });

  it('skips recurring sessions during school holidays', () => {
    const sessions = generateRecurringSessions(new Date(2026, 3, 13), 2);

    expect(sessions.some((session) => session.date >= '2026-04-18' && session.date <= '2026-05-04')).toBe(false);
  });

  it('skips recurring sessions on French public holidays', () => {
    const sessions = generateRecurringSessions(new Date(2026, 4, 25), 1);

    expect(sessions.some((session) => session.date === '2026-05-25')).toBe(false);
    expect(sessions.map((session) => session.date)).toContain('2026-05-27');
  });

  it('starts the 2026-2027 season on Monday 7 September', () => {
    const sessions = generateSeasonSessions(activeDojoSeason);

    expect(sessions.slice(0, 3).map((session) => `${session.date} ${session.startTime} ${session.title}`)).toEqual([
      '2026-09-07 18:00 Enfants 10 à 14 ans',
      '2026-09-07 19:15 Adultes',
      '2026-09-07 20:30 Karaté Contact',
    ]);
  });

  it('generates the 2026-2027 season until before summer holidays', () => {
    const sessions = generateSeasonSessions(activeDojoSeason);
    const lastSession = sessions.at(-1);

    expect(lastSession).toMatchObject({
      date: '2027-07-01',
      title: 'Karaté Contact',
      startTime: '20:30',
    });
    expect(sessions.some((session) => session.date >= '2027-07-03')).toBe(false);
  });

  it('skips 2026-2027 school holiday ranges', () => {
    const sessions = generateSeasonSessions(activeDojoSeason);

    expect(sessions.some((session) => session.date >= '2026-10-17' && session.date <= '2026-11-02')).toBe(false);
    expect(sessions.some((session) => session.date >= '2026-12-19' && session.date <= '2027-01-04')).toBe(false);
    expect(sessions.some((session) => session.date >= '2027-02-06' && session.date <= '2027-02-22')).toBe(false);
    expect(sessions.some((session) => session.date >= '2027-04-03' && session.date <= '2027-04-19')).toBe(false);
  });

  it('skips 2026-2027 public holidays and bridge days', () => {
    const sessions = generateSeasonSessions(activeDojoSeason);

    expect(sessions.some((session) => session.date === '2027-03-29')).toBe(false);
    expect(sessions.some((session) => session.date === '2027-05-06')).toBe(false);
    expect(sessions.some((session) => session.date === '2027-05-07')).toBe(false);
    expect(sessions.some((session) => session.date === '2027-05-17')).toBe(false);
  });

  it('skips Karaté Contact during holidays too', () => {
    const sessions = generateSeasonSessions(activeDojoSeason);

    expect(
      sessions.some(
        (session) =>
          session.title === 'Karaté Contact' &&
          session.date >= '2026-10-17' &&
          session.date <= '2026-11-02',
      ),
    ).toBe(false);
  });

  it('identifies only regular lesson templates as bulk-editable recurring lessons', () => {
    expect(recurringLessonTitles).toEqual([
      'Adultes',
      'Enfants 10 à 14 ans',
      'Enfants de 5 à 9 ans',
      'Karaté Contact',
    ]);
    expect(
      isRecurringLessonSession({
        date: '2026-09-07',
        title: 'Karaté Contact',
        startTime: '20:30',
        endTime: '21:30',
      }),
    ).toBe(true);
    expect(
      isRecurringLessonSession({
        date: '2026-09-12',
        title: 'Stage exceptionnel',
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).toBe(false);
  });
});
