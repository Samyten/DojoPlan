import type {
  Availability,
  AvailabilityStatus,
  BulkAvailabilityInput,
  BulkAvailabilityResult,
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
  getNotificationReadAt(teacherId: string): Promise<string | undefined>;
  markNotificationsRead(teacherId: string, readThrough: string): Promise<string>;
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
  bulkUpdateAvailability(input: BulkAvailabilityInput): Promise<BulkAvailabilityResult>;
  updateLessonPlan(sessionId: string, lessonPlan: string, actorTeacherId: string): Promise<Session>;
  resetMockData(): Promise<DojoDataState>;
}
