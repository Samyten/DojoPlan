import type {
  Availability,
  AvailabilityStatus,
  CreateTeacherInput,
  CreateSessionInput,
  DojoDataState,
  Session,
  Teacher,
  UpdateSessionInput,
} from '../../types';

export interface DojoRepository {
  getTeachers(): Promise<Teacher[]>;
  getSessions(): Promise<Session[]>;
  getAvailabilityForSession(sessionId: string): Promise<Availability[]>;
  getAllAvailability(): Promise<Availability[]>;
  getRecentChanges(): Promise<DojoDataState['changes']>;
  getDojoData(): Promise<DojoDataState>;
  getDojoDataSnapshot(): DojoDataState;
  createTeacher(input: CreateTeacherInput, actorTeacherId: string): Promise<Teacher>;
  updateTeacherRole(
    teacherId: string,
    role: CreateTeacherInput['role'],
    actorTeacherId: string,
  ): Promise<Teacher>;
  reorderTeachers(orderedTeacherIds: string[], actorTeacherId: string): Promise<Teacher[]>;
  deleteTeacher(teacherId: string, actorTeacherId: string): Promise<Teacher>;
  createSession(input: CreateSessionInput, actorTeacherId: string): Promise<Session>;
  updateSession(
    sessionId: string,
    input: UpdateSessionInput,
    actorTeacherId: string,
  ): Promise<Session>;
  deleteSession(sessionId: string, actorTeacherId: string): Promise<Session>;
  updateAvailability(
    sessionId: string,
    teacherId: string,
    status: AvailabilityStatus,
    comment?: string,
    actorTeacherId?: string,
  ): Promise<Availability>;
  updateLessonPlan(sessionId: string, lessonPlan: string, actorTeacherId: string): Promise<Session>;
  resetMockData(): Promise<DojoDataState>;
}
