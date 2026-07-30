import type { Availability, ChangeLogEntry, DojoDataState, Teacher } from '../types';
import { generateSeasonSessions } from '../utils/sessionGeneration';

export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-marc-piperno',
    name: 'Marc Piperno',
    email: 'marc.piperno@dojo.local',
    role: 'admin',
    displayOrder: 1,
  },
  {
    id: 'teacher-christian-martinez',
    name: 'Christian Martinez',
    email: 'christian.martinez20@wanadoo.fr',
    role: 'teacher',
    displayOrder: 2,
  },
  {
    id: 'teacher-jean-rene-foulquier',
    name: 'Jean-René FOULQUIER',
    email: 'jeanrene.foulquier@sfr.fr',
    role: 'teacher',
    displayOrder: 3,
  },
  {
    id: 'teacher-hugo-amador',
    name: 'Hugo Amador',
    email: 'amadorhugo31@gmail.com',
    role: 'teacher',
    displayOrder: 4,
  },
  {
    id: 'teacher-matthieu-piperno',
    name: 'Matthieu Piperno',
    email: 'matthieupiperno@gmail.com',
    role: 'teacher',
    displayOrder: 5,
  },
  {
    id: 'teacher-samy-belkacemi',
    name: 'Samy Belkacemi',
    email: 'samy.belkacemi@dojo.local',
    role: 'super_admin',
    displayOrder: 6,
  },
  {
    id: 'teacher-lohan-amador',
    name: 'Lohan Amador',
    email: 'lohanamador66@gmail.com',
    role: 'teacher',
    displayOrder: 7,
  },
  {
    id: 'teacher-camille-piperno',
    name: 'Camille Piperno',
    email: 'camille.piperno@icloud.com',
    role: 'teacher',
    displayOrder: 8,
  },
  {
    id: 'teacher-sebastien-calvet',
    name: 'Sébastien Calvet',
    email: 'sebastien.calvet66@free.fr',
    role: 'teacher',
    displayOrder: 9,
  },
];

const generatedSessions = generateSeasonSessions();
export const mockAvailability: Availability[] = [];

export const mockChanges: ChangeLogEntry[] = [];

export const mockDojoData: DojoDataState = {
  teachers: mockTeachers,
  sessions: generatedSessions,
  availability: mockAvailability,
  changes: mockChanges,
};
