export type TeacherRole = 'super_admin' | 'admin' | 'teacher';

export type AvailabilityStatus = 'present' | 'absent' | 'maybe' | 'unknown';

export type ChangeLogType =
  | 'session_created'
  | 'session_updated'
  | 'session_deleted'
  | 'session_time_changed'
  | 'availability_changed'
  | 'lesson_plan_added'
  | 'lesson_plan_updated'
  | 'notes_updated';

export interface Teacher {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  role: TeacherRole;
  displayOrder?: number;
}

export interface CreateTeacherInput {
  name: string;
  email: string;
  role: Exclude<TeacherRole, 'super_admin'>;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  lessonPlan?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  lessonPlan?: string;
  notes?: string;
}

export type UpdateSessionInput = CreateSessionInput;

export interface Availability {
  id: string;
  sessionId: string;
  teacherId: string;
  status: AvailabilityStatus;
  comment?: string;
  updatedAt: string;
}

export interface BulkAvailabilityInput {
  targetTeacherId: string;
  actorTeacherId: string;
  sessionIds: string[];
  status: AvailabilityStatus;
  comment?: string;
  overwriteExisting: boolean;
}

export interface BulkAvailabilityResult {
  targetTeacherId: string;
  status: AvailabilityStatus;
  matchedCount: number;
  updatedCount: number;
  skippedCount: number;
}

export interface ChangeLogEntry {
  id: string;
  sessionId?: string;
  teacherId?: string;
  actorTeacherId: string;
  type: ChangeLogType;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ForumMessage {
  id: string;
  teacherId?: string;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface DojoDataState {
  teachers: Teacher[];
  sessions: Session[];
  availability: Availability[];
  changes: ChangeLogEntry[];
}
