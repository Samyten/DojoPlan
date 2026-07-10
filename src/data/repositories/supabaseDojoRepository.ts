import type {
  Availability,
  AvailabilityStatus,
  BulkAvailabilityInput,
  BulkAvailabilityResult,
  ChangeLogEntry,
  CreateSessionInput,
  CreateTeacherInput,
  DojoDataState,
  Session,
  Teacher,
  TeacherRole,
  UpdateSessionInput,
} from '../../types';
import { compareSessionDateTime, formatCourseDate } from '../../utils/dates';
import { assertValidSessionInput } from '../../utils/sessionValidation';
import { getSupabaseClient } from '../../lib/supabaseClient';

type TeacherRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: TeacherRole;
  display_order: number | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  lesson_plan: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AvailabilityRow = {
  id: string;
  session_id: string;
  teacher_id: string;
  status: AvailabilityStatus;
  comment: string | null;
  updated_at: string;
};

type ChangeLogEntryRow = {
  id: string;
  session_id: string | null;
  teacher_id: string | null;
  actor_teacher_id: string | null;
  type: ChangeLogEntry['type'];
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type NotificationReadStateRow = {
  teacher_id: string;
  last_read_at: string;
};

type BulkAvailabilityResultRow = {
  target_teacher_id: string;
  status: AvailabilityStatus;
  matched_count: number;
  updated_count: number;
  skipped_count: number;
};

const emptyState: DojoDataState = {
  teachers: [],
  sessions: [],
  availability: [],
  changes: [],
};

export async function getTeachers(): Promise<Teacher[]> {
  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .select('id,auth_user_id,name,email,role,display_order,created_at')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('name');

  if (error) {
    throw error;
  }

  return (data as TeacherRow[]).map(mapTeacherRow);
}

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await getSupabaseClient()
    .from('sessions')
    .select('id,title,date,start_time,end_time,location,lesson_plan,notes,created_at,updated_at')
    .order('date')
    .order('start_time');

  if (error) {
    throw error;
  }

  return (data as SessionRow[]).map(mapSessionRow).sort(compareSessionDateTime);
}

export async function getAvailabilityForSession(sessionId: string): Promise<Availability[]> {
  const { data, error } = await getSupabaseClient()
    .from('availability')
    .select('id,session_id,teacher_id,status,comment,updated_at')
    .eq('session_id', sessionId);

  if (error) {
    throw error;
  }

  return (data as AvailabilityRow[]).map(mapAvailabilityRow);
}

export async function getAllAvailability(): Promise<Availability[]> {
  const { data, error } = await getSupabaseClient()
    .from('availability')
    .select('id,session_id,teacher_id,status,comment,updated_at');

  if (error) {
    throw error;
  }

  return (data as AvailabilityRow[]).map(mapAvailabilityRow);
}

export async function getRecentChanges(): Promise<ChangeLogEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from('change_log_entries')
    .select('id,session_id,teacher_id,actor_teacher_id,type,description,metadata,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as ChangeLogEntryRow[]).map(mapChangeLogEntryRow);
}

export async function getNotificationReadAt(teacherId: string): Promise<string | undefined> {
  const { data, error } = await getSupabaseClient()
    .from('notification_read_state')
    .select('teacher_id,last_read_at')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as NotificationReadStateRow | null)?.last_read_at;
}

export async function markNotificationsRead(
  teacherId: string,
  readThrough: string,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from('notification_read_state')
    .upsert(
      {
        teacher_id: teacherId,
        last_read_at: readThrough,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'teacher_id' },
    )
    .select('teacher_id,last_read_at')
    .single();

  if (error) {
    throw error;
  }

  return (data as NotificationReadStateRow).last_read_at;
}

export async function getDojoData(): Promise<DojoDataState> {
  const [teachers, sessions, availability, changes] = await Promise.all([
    getTeachers(),
    getSessions(),
    getAllAvailability(),
    getRecentChanges(),
  ]);

  return {
    teachers,
    sessions,
    availability,
    changes,
  };
}

export function getDojoDataSnapshot(): DojoDataState {
  return structuredClone(emptyState);
}

export async function createTeacher(
  input: CreateTeacherInput,
  actorTeacherId: string,
): Promise<Teacher> {
  const actor = await getTeacherOrThrow(actorTeacherId);
  assertSuperAdmin(actor);

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    throw new Error('Teacher name and email are required.');
  }

  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .insert({
      name,
      email,
      role: input.role,
      display_order: await getNextTeacherDisplayOrder(),
    })
    .select('id,auth_user_id,name,email,role,display_order,created_at')
    .single();

  if (error) {
    throw error;
  }

  return mapTeacherRow(data as TeacherRow);
}

export async function updateTeacherRole(
  teacherId: string,
  role: CreateTeacherInput['role'],
  actorTeacherId: string,
): Promise<Teacher> {
  const [actor, teacher] = await Promise.all([
    getTeacherOrThrow(actorTeacherId),
    getTeacherOrThrow(teacherId),
  ]);
  assertSuperAdmin(actor);

  if (teacher.id === actorTeacherId) {
    throw new Error('The super admin role cannot be changed from the app.');
  }

  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .update({ role })
    .eq('id', teacherId)
    .select('id,auth_user_id,name,email,role,display_order,created_at')
    .single();

  if (error) {
    throw error;
  }

  return mapTeacherRow(data as TeacherRow);
}

export async function reorderTeachers(
  orderedTeacherIds: string[],
  actorTeacherId: string,
): Promise<Teacher[]> {
  const [actor, teachers] = await Promise.all([getTeacherOrThrow(actorTeacherId), getTeachers()]);
  assertSuperAdmin(actor);

  const knownTeacherIds = new Set(teachers.map((teacher) => teacher.id));

  if (
    orderedTeacherIds.length !== teachers.length ||
    orderedTeacherIds.some((teacherId) => !knownTeacherIds.has(teacherId))
  ) {
    throw new Error('Teacher order must include every known teacher exactly once.');
  }

  const uniqueTeacherIds = new Set(orderedTeacherIds);

  if (uniqueTeacherIds.size !== orderedTeacherIds.length) {
    throw new Error('Teacher order cannot contain duplicates.');
  }

  await Promise.all(
    orderedTeacherIds.map((teacherId, index) =>
      getSupabaseClient()
        .from('teachers')
        .update({ display_order: index + 1 })
        .eq('id', teacherId)
        .then(({ error }) => {
          if (error) {
            throw error;
          }
        }),
    ),
  );

  return getTeachers();
}

export async function deleteTeacher(teacherId: string, actorTeacherId: string): Promise<Teacher> {
  const [actor, teacher] = await Promise.all([
    getTeacherOrThrow(actorTeacherId),
    getTeacherOrThrow(teacherId),
  ]);
  assertSuperAdmin(actor);

  if (teacher.id === actorTeacherId || teacher.role === 'super_admin') {
    throw new Error('The super admin cannot be removed from the app.');
  }

  const { error } = await getSupabaseClient().from('teachers').delete().eq('id', teacherId);

  if (error) {
    throw error;
  }

  return teacher;
}

export async function createSession(
  input: CreateSessionInput,
  actorTeacherId: string,
): Promise<Session> {
  assertValidSessionInput(input);
  const actor = await getTeacherOrThrow(actorTeacherId);
  assertAdmin(actor);

  const { data, error } = await getSupabaseClient()
    .from('sessions')
    .insert(toSessionInsert(input))
    .select('id,title,date,start_time,end_time,location,lesson_plan,notes,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  const session = mapSessionRow(data as SessionRow);
  await createChangeLogEntry({
    sessionId: session.id,
    actorTeacherId,
    type: 'session_created',
    description: `${actor.name} a ajouté un nouveau cours : ${session.title}.`,
    metadata: {
      sessionDate: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
    },
  });

  return session;
}

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
  actorTeacherId: string,
): Promise<Session> {
  assertValidSessionInput(input);
  const [actor, previousSession] = await Promise.all([
    getTeacherOrThrow(actorTeacherId),
    getSessionOrThrow(sessionId),
  ]);
  assertAdmin(actor);

  const { data, error } = await getSupabaseClient()
    .from('sessions')
    .update({
      ...toSessionInsert(input),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('id,title,date,start_time,end_time,location,lesson_plan,notes,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  const session = mapSessionRow(data as SessionRow);
  await createChangeLogEntry({
    sessionId,
    actorTeacherId,
    type: 'session_updated',
    description: describeSessionUpdate(actor.name, previousSession, session),
    metadata: {
      previousSession,
      nextSession: session,
    },
  });

  return session;
}

export async function deleteSession(sessionId: string, actorTeacherId: string): Promise<Session> {
  const [actor, session] = await Promise.all([
    getTeacherOrThrow(actorTeacherId),
    getSessionOrThrow(sessionId),
  ]);
  assertAdmin(actor);

  await createChangeLogEntry({
    sessionId,
    actorTeacherId,
    type: 'session_deleted',
    description: `${actor.name} a supprimé le ${formatSessionForDelete(session)}.`,
    metadata: {
      deletedSession: session,
    },
  });

  const { error } = await getSupabaseClient().from('sessions').delete().eq('id', sessionId);

  if (error) {
    throw error;
  }

  return session;
}

export async function updateAvailability(
  sessionId: string,
  teacherId: string,
  status: AvailabilityStatus,
  comment = '',
  actorTeacherId = teacherId,
): Promise<Availability> {
  const [session, actor, targetTeacher, existing] = await Promise.all([
    getSessionOrThrow(sessionId),
    getCurrentTeacherOrThrow(),
    getTeacherOrThrow(teacherId),
    getExistingAvailability(sessionId, teacherId),
  ]);
  void actorTeacherId;
  const previousStatus = existing?.status ?? 'unknown';
  const previousComment = existing?.comment ?? '';
  const now = new Date().toISOString();

  if (actor.id !== targetTeacher.id && actor.role !== 'admin' && actor.role !== 'super_admin') {
    throw new Error('Only admins can update availability for another teacher.');
  }

  const { data, error } = await getSupabaseClient()
    .from('availability')
    .upsert(
      {
        id: existing?.id,
        session_id: sessionId,
        teacher_id: teacherId,
        status,
        comment,
        updated_at: now,
      },
      { onConflict: 'session_id,teacher_id' },
    )
    .select('id,session_id,teacher_id,status,comment,updated_at')
    .single();

  if (error) {
    throw error;
  }

  if (previousStatus !== status || previousComment !== comment) {
    await createChangeLogEntry({
      sessionId,
      teacherId,
      actorTeacherId: actor.id,
      type: 'availability_changed',
      description: describeAvailabilityChange(
        actor.name,
        targetTeacher.name,
        session,
        status,
        previousStatus !== status,
      ),
      metadata: {
        previousStatus,
        nextStatus: status,
      },
    });
  }

  return mapAvailabilityRow(data as AvailabilityRow);
}

export async function bulkUpdateAvailability(
  input: BulkAvailabilityInput,
): Promise<BulkAvailabilityResult> {
  const { data, error } = await getSupabaseClient()
    .rpc('bulk_update_availability', {
      p_target_teacher_id: input.targetTeacherId,
      p_session_ids: input.sessionIds,
      p_status: input.status,
      p_comment: input.comment ?? '',
      p_overwrite_existing: input.overwriteExisting,
    })
    .single();

  if (error) {
    throw error;
  }

  // Keep the repository signature stable; the RPC derives the trusted actor from auth.uid().
  void input.actorTeacherId;
  return mapBulkAvailabilityResult(data as BulkAvailabilityResultRow);
}

export async function updateLessonPlan(
  sessionId: string,
  lessonPlan: string,
  actorTeacherId: string,
): Promise<Session> {
  const { data, error } = await getSupabaseClient()
    .rpc('update_session_lesson_content', {
      p_session_id: sessionId,
      p_lesson_plan: lessonPlan,
    })
    .single();

  if (error) {
    throw error;
  }

  // Keep the repository signature stable; the RPC derives the trusted actor from auth.uid().
  void actorTeacherId;
  return mapSessionRow(data as SessionRow);
}

export async function resetMockData(): Promise<DojoDataState> {
  throw new Error(
    "La réinitialisation des données de test n'est disponible qu'en mode local. Utilisez supabase/seed.sql pour réinitialiser Supabase.",
  );
}

async function getNextTeacherDisplayOrder() {
  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .select('display_order')
    .order('display_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data?.display_order as number | null | undefined) ?? 0) + 1;
}

async function getTeacherOrThrow(teacherId: string) {
  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .select('id,auth_user_id,name,email,role,display_order,created_at')
    .eq('id', teacherId)
    .single();

  if (error || !data) {
    throw error ?? new Error('Unknown teacher.');
  }

  return mapTeacherRow(data as TeacherRow);
}

async function getCurrentTeacherOrThrow() {
  const {
    data: { user },
    error: authError,
  } = await getSupabaseClient().auth.getUser();

  if (authError || !user) {
    throw authError ?? new Error('Authentication required.');
  }

  const { data, error } = await getSupabaseClient()
    .from('teachers')
    .select('id,auth_user_id,name,email,role,display_order,created_at')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !data) {
    throw error ?? new Error('No linked teacher profile found for this authenticated user.');
  }

  return mapTeacherRow(data as TeacherRow);
}

async function getSessionOrThrow(sessionId: string) {
  const { data, error } = await getSupabaseClient()
    .from('sessions')
    .select('id,title,date,start_time,end_time,location,lesson_plan,notes,created_at,updated_at')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    throw error ?? new Error('Unknown session.');
  }

  return mapSessionRow(data as SessionRow);
}

async function getExistingAvailability(sessionId: string, teacherId: string) {
  const { data, error } = await getSupabaseClient()
    .from('availability')
    .select('id,session_id,teacher_id,status,comment,updated_at')
    .eq('session_id', sessionId)
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapAvailabilityRow(data as AvailabilityRow) : undefined;
}

async function createChangeLogEntry(input: {
  sessionId?: string;
  teacherId?: string;
  actorTeacherId: string;
  type: ChangeLogEntry['type'];
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await getSupabaseClient().from('change_log_entries').insert({
    session_id: input.sessionId,
    teacher_id: input.teacherId,
    actor_teacher_id: input.actorTeacherId,
    type: input.type,
    description: input.description,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }
}

function assertAdmin(teacher: Teacher) {
  if (teacher.role !== 'admin' && teacher.role !== 'super_admin') {
    throw new Error('Only admins can manage sessions.');
  }
}

function assertSuperAdmin(teacher: Teacher) {
  if (teacher.role !== 'super_admin') {
    throw new Error('Only the super admin can manage teachers.');
  }
}

function toSessionInsert(input: CreateSessionInput) {
  return {
    title: input.title.trim(),
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    location: input.location?.trim() || null,
    lesson_plan: input.lessonPlan?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
  };
}

function mapTeacherRow(row: TeacherRow): Teacher {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.name,
    email: row.email,
    role: row.role,
    displayOrder: row.display_order ?? undefined,
  };
}

function mapSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    location: row.location ?? undefined,
    lessonPlan: row.lesson_plan ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAvailabilityRow(row: AvailabilityRow): Availability {
  return {
    id: row.id,
    sessionId: row.session_id,
    teacherId: row.teacher_id,
    status: row.status,
    comment: row.comment ?? '',
    updatedAt: row.updated_at,
  };
}

function mapChangeLogEntryRow(row: ChangeLogEntryRow): ChangeLogEntry {
  return {
    id: row.id,
    sessionId: row.session_id ?? undefined,
    teacherId: row.teacher_id ?? undefined,
    actorTeacherId: row.actor_teacher_id ?? '',
    type: row.type,
    description: row.description,
    createdAt: row.created_at,
    metadata: row.metadata ?? undefined,
  };
}

function mapBulkAvailabilityResult(row: BulkAvailabilityResultRow): BulkAvailabilityResult {
  return {
    targetTeacherId: row.target_teacher_id,
    status: row.status,
    matchedCount: row.matched_count,
    updatedCount: row.updated_count,
    skippedCount: row.skipped_count,
  };
}

function formatSessionForChange(session: Session) {
  return `${session.title.toLowerCase()} du ${formatCourseDate(session.date)}`;
}

function availabilitySentence(status: AvailabilityStatus) {
  switch (status) {
    case 'present':
      return 'qu’il sera présent';
    case 'absent':
      return 'qu’il sera absent';
    case 'maybe':
      return 'qu’il sera peut-être présent';
    case 'unknown':
      return "qu’il n'a pas encore renseigné sa disponibilité";
  }
}

function availabilityTargetSentence(status: AvailabilityStatus) {
  switch (status) {
    case 'present':
      return 'sera présent';
    case 'absent':
      return 'sera absent';
    case 'maybe':
      return 'sera peut-être présent';
    case 'unknown':
      return "n'a pas encore renseigné sa disponibilité";
  }
}

function describeAvailabilityChange(
  actorName: string,
  targetName: string,
  session: Session,
  nextStatus: AvailabilityStatus,
  statusChanged: boolean,
) {
  if (actorName !== targetName) {
    return `${actorName} a indiqué que ${targetName} ${availabilityTargetSentence(nextStatus)} pour le ${formatSessionForChange(session)}.`;
  }

  if (!statusChanged) {
    return `${actorName} a modifié sa disponibilité pour le ${formatSessionForChange(session)}.`;
  }

  return `${actorName} a indiqué ${availabilitySentence(nextStatus)} pour le ${formatSessionForChange(session)}.`;
}

function formatSessionForDelete(session: Session) {
  const title = session.title.toLowerCase().startsWith('cours ')
    ? session.title.toLowerCase()
    : `cours ${session.title}`;

  return `${title} du ${formatCourseDate(session.date)}`;
}

function describeSessionUpdate(actorName: string, previousSession: Session, nextSession: Session) {
  const moved =
    previousSession.date !== nextSession.date ||
    previousSession.startTime !== nextSession.startTime ||
    previousSession.endTime !== nextSession.endTime;

  if (moved) {
    return `${actorName} a déplacé ${nextSession.title} au ${formatCourseDate(nextSession.date)}.`;
  }

  return `${actorName} a modifié le ${formatSessionForChange(nextSession)}.`;
}
