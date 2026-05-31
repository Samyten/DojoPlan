export interface RecurringLessonTemplate {
  id: string;
  dayOfWeek: number;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export const recurringLessonTemplates: RecurringLessonTemplate[] = [
  {
    id: 'monday-kids',
    dayOfWeek: 1,
    title: 'Enfants 10 à 14 ans',
    startTime: '18:00',
    endTime: '19:15',
    location: 'Dojo principal',
  },
  {
    id: 'monday-adults',
    dayOfWeek: 1,
    title: 'Adultes',
    startTime: '19:15',
    endTime: '20:30',
    location: 'Dojo principal',
  },
  {
    id: 'wednesday-small-kids',
    dayOfWeek: 3,
    title: 'Enfants de 5 à 9 ans',
    startTime: '17:15',
    endTime: '18:30',
    location: 'Dojo principal',
  },
  {
    id: 'thursday-kids',
    dayOfWeek: 4,
    title: 'Enfants 10 à 14 ans',
    startTime: '18:00',
    endTime: '19:15',
    location: 'Dojo principal',
  },
  {
    id: 'thursday-adults',
    dayOfWeek: 4,
    title: 'Adultes',
    startTime: '19:15',
    endTime: '20:30',
    location: 'Dojo principal',
  },
];
