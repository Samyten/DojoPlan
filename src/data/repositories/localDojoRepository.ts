import { mockDojoData } from '../mockData';
import type {
  Availability,
  AvailabilityStatus,
  BulkAvailabilityInput,
  BulkAvailabilityResult,
  ChangeLogEntry,
  CreateSessionInput,
  CreateTeacherInput,
  DojoDataState,
  ForumMessage,
  PushSubscriptionInput,
  Session,
  Teacher,
  UpdateSessionInput,
} from '../../types';
import { compareSessionDateTime, formatCourseDate } from '../../utils/dates';
import { assertValidSessionInput } from '../../utils/sessionValidation';

const STORAGE_KEY = 'dojo-planning.mock-state.v8';
const NOTIFICATION_READ_STORAGE_KEY = 'dojo-planning.notification-read.v1';
const FORUM_MESSAGES_STORAGE_KEY = 'dojo-planning.forum-messages.v1';
const FORUM_READ_STORAGE_KEY = 'dojo-planning.forum-read.v1';
const PUSH_SUBSCRIPTIONS_STORAGE_KEY = 'dojo-planning.push-subscriptions.v1';

type LocalPushSubscription = PushSubscriptionInput & {
  teacherId: string;
};

function cloneState(state: DojoDataState): DojoDataState {
  return structuredClone(state);
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadState(): DojoDataState {
  if (!canUseLocalStorage()) {
    return cloneState(mockDojoData);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const initialState = cloneState(mockDojoData);
    saveState(initialState);
    return initialState;
  }

  try {
    return JSON.parse(stored) as DojoDataState;
  } catch {
    const initialState = cloneState(mockDojoData);
    saveState(initialState);
    return initialState;
  }
}

function saveState(state: DojoDataState) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function loadNotificationReadState(): Record<string, string> {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function saveNotificationReadState(state: Record<string, string>) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(state));
  }
}

function loadForumMessages(): ForumMessage[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const messages = JSON.parse(
      window.localStorage.getItem(FORUM_MESSAGES_STORAGE_KEY) ?? '[]',
    ) as ForumMessage[];
    return structuredClone(messages).sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  } catch {
    return [];
  }
}

function saveForumMessages(messages: ForumMessage[]) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(FORUM_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }
}

function loadForumReadState(): Record<string, string> {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(FORUM_READ_STORAGE_KEY) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function saveForumReadState(state: Record<string, string>) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(FORUM_READ_STORAGE_KEY, JSON.stringify(state));
  }
}

function loadPushSubscriptions(): LocalPushSubscription[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    return JSON.parse(
      window.localStorage.getItem(PUSH_SUBSCRIPTIONS_STORAGE_KEY) ?? '[]',
    ) as LocalPushSubscription[];
  } catch {
    return [];
  }
}

function savePushSubscriptions(subscriptions: LocalPushSubscription[]) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(PUSH_SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findTeacher(state: DojoDataState, teacherId: string) {
  return state.teachers.find((teacher) => teacher.id === teacherId);
}

function findSession(state: DojoDataState, sessionId: string) {
  return state.sessions.find((session) => session.id === sessionId);
}

function assertCanManageSessions(teacher: Teacher | undefined): asserts teacher is Teacher {
  if (!teacher || (teacher.role !== 'admin' && teacher.role !== 'super_admin')) {
    throw new Error('Only admins can manage sessions.');
  }
}

function assertSuperAdmin(teacher: Teacher | undefined): asserts teacher is Teacher {
  if (!teacher || teacher.role !== 'super_admin') {
    throw new Error('Only the super admin can manage teachers.');
  }
}

function assertCanManageAvailabilityFor(
  actor: Teacher | undefined,
  targetTeacherId: string,
): asserts actor is Teacher {
  if (!actor) {
    throw new Error('Cannot update availability for an unknown teacher.');
  }

  if (actor.id !== targetTeacherId && actor.role !== 'admin' && actor.role !== 'super_admin') {
    throw new Error('Only admins can update availability for another teacher.');
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
    return `${actorName} a modifié son commentaire de disponibilité pour le ${formatSessionForChange(session)}.`;
  }

  return `${actorName} a indiqué ${availabilitySentence(nextStatus)} pour le ${formatSessionForChange(session)}.`;
}

function availabilityTargetSentence(status: AvailabilityStatus) {
  const labels: Record<AvailabilityStatus, string> = {
    present: 'sera présent',
    absent: 'sera absent',
    maybe: 'est peut-être disponible',
    unknown: "n'a pas de disponibilité renseignée",
  };

  return labels[status];
}

function availabilitySentence(status: AvailabilityStatus) {
  const labels: Record<AvailabilityStatus, string> = {
    present: "qu'il sera présent",
    absent: "qu'il sera absent",
    maybe: "qu'il est peut-être disponible",
    unknown: "que sa disponibilité n'est pas renseignée",
  };

  return labels[status];
}

function formatSessionForChange(session: Session) {
  return `${session.title.toLowerCase()} du ${formatCourseDate(session.date)}`;
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

function normalizeSessionInput(input: CreateSessionInput) {
  return {
    title: input.title.trim(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location?.trim() || undefined,
    lessonPlan: input.lessonPlan?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
  };
}

function addChange(state: DojoDataState, entry: Omit<ChangeLogEntry, 'id' | 'createdAt'>) {
  state.changes.unshift({
    id: createId('change'),
    createdAt: new Date().toISOString(),
    ...entry,
  });
}

function sortSessions(sessions: Session[]) {
  return [...sessions].sort(compareSessionDateTime);
}

function sortTeachers(teachers: Teacher[]) {
  return [...teachers].sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.POSITIVE_INFINITY;
    const rightOrder = right.displayOrder ?? Number.POSITIVE_INFINITY;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' });
  });
}

function sortChanges(changes: ChangeLogEntry[]) {
  return [...changes].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function toSnapshot(state: DojoDataState): DojoDataState {
  const snapshot = cloneState(state);

  return {
    teachers: sortTeachers(snapshot.teachers),
    sessions: sortSessions(snapshot.sessions),
    availability: snapshot.availability,
    changes: sortChanges(snapshot.changes),
  };
}

export async function getTeachers(): Promise<Teacher[]> {
  return toSnapshot(loadState()).teachers;
}

export async function getSessions(): Promise<Session[]> {
  return toSnapshot(loadState()).sessions;
}

export async function getAvailabilityForSession(sessionId: string): Promise<Availability[]> {
  return toSnapshot(loadState()).availability.filter(
    (availability) => availability.sessionId === sessionId,
  );
}

export async function getAllAvailability(): Promise<Availability[]> {
  return toSnapshot(loadState()).availability;
}

export async function getRecentChanges(): Promise<ChangeLogEntry[]> {
  return toSnapshot(loadState()).changes;
}

export async function getForumMessages(): Promise<ForumMessage[]> {
  return loadForumMessages();
}

export async function getForumReadAt(teacherId: string): Promise<string | undefined> {
  return loadForumReadState()[teacherId];
}

export async function markForumRead(teacherId: string, readThrough: string): Promise<string> {
  const state = loadState();

  if (!findTeacher(state, teacherId)) {
    throw new Error('Cannot update Forum read state for an unknown teacher.');
  }

  const readState = loadForumReadState();
  const nextReadAt =
    readState[teacherId] && readState[teacherId] > readThrough
      ? readState[teacherId]
      : readThrough;

  readState[teacherId] = nextReadAt;
  saveForumReadState(readState);
  return nextReadAt;
}

export async function getNotificationReadAt(teacherId: string): Promise<string | undefined> {
  return loadNotificationReadState()[teacherId];
}

export async function markNotificationsRead(
  teacherId: string,
  readThrough: string,
): Promise<string> {
  const state = loadState();

  if (!findTeacher(state, teacherId)) {
    throw new Error('Cannot update notifications for an unknown teacher.');
  }

  const readState = loadNotificationReadState();
  const nextReadAt =
    readState[teacherId] && readState[teacherId] > readThrough
      ? readState[teacherId]
      : readThrough;

  readState[teacherId] = nextReadAt;
  saveNotificationReadState(readState);
  return nextReadAt;
}

export async function getDojoData(): Promise<DojoDataState> {
  return getDojoDataSnapshot();
}

export async function createForumMessage(
  message: string,
  actorTeacherId: string,
): Promise<ForumMessage> {
  const actor = findTeacher(loadState(), actorTeacherId);
  const normalizedMessage = message.trim();

  if (!actor) {
    throw new Error('Cannot post a forum message for an unknown teacher.');
  }

  if (!normalizedMessage || normalizedMessage.length > 2000) {
    throw new Error('Forum messages must contain between 1 and 2000 characters.');
  }

  const forumMessage: ForumMessage = {
    id: createId('forum'),
    teacherId: actor.id,
    authorName: actor.name,
    message: normalizedMessage,
    createdAt: new Date().toISOString(),
  };
  const messages = loadForumMessages();
  messages.push(forumMessage);
  saveForumMessages(messages);

  return structuredClone(forumMessage);
}

export async function savePushSubscription(
  subscription: PushSubscriptionInput,
  actorTeacherId: string,
): Promise<void> {
  if (!findTeacher(loadState(), actorTeacherId)) {
    throw new Error('Cannot save a push subscription for an unknown teacher.');
  }

  if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
    throw new Error('A complete push subscription is required.');
  }

  const subscriptions = loadPushSubscriptions().filter(
    (item) => item.endpoint !== subscription.endpoint,
  );
  subscriptions.push({ ...structuredClone(subscription), teacherId: actorTeacherId });
  savePushSubscriptions(subscriptions);
}

export async function deletePushSubscription(
  endpoint: string,
  actorTeacherId: string,
): Promise<void> {
  if (!findTeacher(loadState(), actorTeacherId)) {
    throw new Error('Cannot delete a push subscription for an unknown teacher.');
  }

  savePushSubscriptions(
    loadPushSubscriptions().filter(
      (item) => item.endpoint !== endpoint || item.teacherId !== actorTeacherId,
    ),
  );
}

export function getDojoDataSnapshot(): DojoDataState {
  return toSnapshot(loadState());
}

export async function createTeacher(
  input: CreateTeacherInput,
  actorTeacherId: string,
): Promise<Teacher> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  assertSuperAdmin(actor);

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    throw new Error('Teacher name and email are required.');
  }

  if (state.teachers.some((teacher) => teacher.email.toLowerCase() === email)) {
    throw new Error('A teacher with this email already exists.');
  }

  const teacher: Teacher = {
    id: createId('teacher'),
    name,
    email,
    role: input.role,
    displayOrder: Math.max(0, ...state.teachers.map((item) => item.displayOrder ?? 0)) + 1,
  };

  state.teachers.push(teacher);
  saveState(state);
  return structuredClone(teacher);
}

export async function reorderTeachers(
  orderedTeacherIds: string[],
  actorTeacherId: string,
): Promise<Teacher[]> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  assertSuperAdmin(actor);

  const knownTeacherIds = new Set(state.teachers.map((teacher) => teacher.id));

  if (
    orderedTeacherIds.length !== state.teachers.length ||
    orderedTeacherIds.some((teacherId) => !knownTeacherIds.has(teacherId))
  ) {
    throw new Error('Teacher order must include every known teacher exactly once.');
  }

  const uniqueTeacherIds = new Set(orderedTeacherIds);

  if (uniqueTeacherIds.size !== orderedTeacherIds.length) {
    throw new Error('Teacher order cannot contain duplicates.');
  }

  const displayOrderById = new Map(
    orderedTeacherIds.map((teacherId, index) => [teacherId, index + 1]),
  );

  state.teachers = state.teachers.map((teacher) => ({
    ...teacher,
    displayOrder: displayOrderById.get(teacher.id),
  }));

  saveState(state);
  return toSnapshot(state).teachers;
}

export async function updateTeacherRole(
  teacherId: string,
  role: CreateTeacherInput['role'],
  actorTeacherId: string,
): Promise<Teacher> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  const teacher = findTeacher(state, teacherId);
  assertSuperAdmin(actor);

  if (!teacher) {
    throw new Error('Cannot update an unknown teacher.');
  }

  if (teacher.id === actorTeacherId) {
    throw new Error('The super admin role cannot be changed from the app.');
  }

  teacher.role = role;
  saveState(state);
  return structuredClone(teacher);
}

export async function deleteTeacher(teacherId: string, actorTeacherId: string): Promise<Teacher> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  const teacher = findTeacher(state, teacherId);
  assertSuperAdmin(actor);

  if (!teacher) {
    throw new Error('Cannot delete an unknown teacher.');
  }

  if (teacher.id === actorTeacherId || teacher.role === 'super_admin') {
    throw new Error('The super admin cannot be removed from the app.');
  }

  const deletedTeacher = structuredClone(teacher);
  state.teachers = state.teachers.filter((item) => item.id !== teacherId);
  state.availability = state.availability.filter((item) => item.teacherId !== teacherId);
  saveState(state);
  return deletedTeacher;
}

export async function updateAvailability(
  sessionId: string,
  teacherId: string,
  status: AvailabilityStatus,
  comment = '',
  actorTeacherId = teacherId,
): Promise<Availability> {
  const state = loadState();
  const now = new Date().toISOString();
  const session = findSession(state, sessionId);
  const actor = findTeacher(state, actorTeacherId);
  const targetTeacher = findTeacher(state, teacherId);
  const existing = state.availability.find(
    (availability) => availability.sessionId === sessionId && availability.teacherId === teacherId,
  );

  if (!session || !targetTeacher) {
    throw new Error('Cannot update availability for an unknown session or teacher.');
  }

  assertCanManageAvailabilityFor(actor, teacherId);

  const previousStatus = existing?.status ?? 'unknown';
  const previousComment = existing?.comment ?? '';

  if (existing) {
    existing.status = status;
    existing.comment = comment;
    existing.updatedAt = now;
  } else {
    state.availability.push({
      id: createId('availability'),
      sessionId,
      teacherId,
      status,
      comment,
      updatedAt: now,
    });
  }

  const nextAvailability = state.availability.find(
    (availability) => availability.sessionId === sessionId && availability.teacherId === teacherId,
  );

  if (!nextAvailability) {
    throw new Error('Availability update failed.');
  }

  if (previousStatus !== status || previousComment !== comment) {
    const description = describeAvailabilityChange(
      actor.name,
      targetTeacher.name,
      session,
      status,
      previousStatus !== status,
    );

    addChange(state, {
      sessionId,
      teacherId,
      actorTeacherId,
      type: 'availability_changed',
      description,
      metadata: {
        previousStatus,
        nextStatus: status,
      },
    });
  }

  saveState(state);
  return structuredClone(nextAvailability);
}

export async function bulkUpdateAvailability(
  input: BulkAvailabilityInput,
): Promise<BulkAvailabilityResult> {
  const state = loadState();
  const actor = findTeacher(state, input.actorTeacherId);
  const targetTeacher = findTeacher(state, input.targetTeacherId);

  if (!targetTeacher) {
    throw new Error('Cannot update availability for an unknown teacher.');
  }

  assertCanManageAvailabilityFor(actor, input.targetTeacherId);

  const requestedSessionIds = new Set(input.sessionIds);
  const matchingSessions = sortSessions(
    state.sessions.filter((session) => requestedSessionIds.has(session.id)),
  );
  const now = new Date().toISOString();
  let updatedCount = 0;
  let skippedCount = 0;

  for (const session of matchingSessions) {
    const existing = state.availability.find(
      (availability) =>
        availability.sessionId === session.id && availability.teacherId === input.targetTeacherId,
    );
    const hasExplicitExisting =
      Boolean(existing) &&
      (existing?.status !== 'unknown' || Boolean(existing?.comment?.trim()));

    if (hasExplicitExisting && !input.overwriteExisting) {
      skippedCount += 1;
      continue;
    }

    if (existing) {
      existing.status = input.status;
      existing.comment = input.comment ?? '';
      existing.updatedAt = now;
    } else {
      state.availability.push({
        id: createId('availability'),
        sessionId: session.id,
        teacherId: input.targetTeacherId,
        status: input.status,
        comment: input.comment ?? '',
        updatedAt: now,
      });
    }

    updatedCount += 1;
  }

  if (updatedCount > 0 && actor) {
    addChange(state, {
      actorTeacherId: actor.id,
      teacherId: targetTeacher.id,
      type: 'availability_changed',
      description:
        actor.id === targetTeacher.id
          ? `${actor.name} a renseigné ${updatedCount} disponibilités.`
          : `${actor.name} a renseigné ${updatedCount} disponibilités pour ${targetTeacher.name}.`,
      metadata: {
        targetTeacherId: targetTeacher.id,
        affectedSessionCount: updatedCount,
        selectedSessionIds: matchingSessions.map((session) => session.id),
        status: input.status,
        overwriteExisting: input.overwriteExisting,
        skippedCount,
      },
    });
  }

  saveState(state);

  return {
    targetTeacherId: input.targetTeacherId,
    status: input.status,
    matchedCount: matchingSessions.length,
    updatedCount,
    skippedCount,
  };
}

export async function updateLessonPlan(
  sessionId: string,
  lessonPlan: string,
  actorTeacherId: string,
): Promise<Session> {
  const state = loadState();
  const session = findSession(state, sessionId);
  const actor = findTeacher(state, actorTeacherId);

  if (!session || !actor) {
    throw new Error('Cannot update lesson plan for an unknown session or teacher.');
  }

  const previousLessonPlan = session.lessonPlan ?? '';
  const nextLessonPlan = lessonPlan.trim();

  if (previousLessonPlan === nextLessonPlan) {
    return structuredClone(session);
  }

  session.lessonPlan = nextLessonPlan;
  session.updatedAt = new Date().toISOString();

  addChange(state, {
    sessionId,
    actorTeacherId,
    type: previousLessonPlan.trim() ? 'lesson_plan_updated' : 'lesson_plan_added',
    description: previousLessonPlan.trim()
      ? `${actor.name} a modifié le contenu du ${formatSessionForChange(session)}.`
      : `${actor.name} a ajouté le contenu du ${formatSessionForChange(session)}.`,
    metadata: {
      previousLessonPlan,
      nextLessonPlan,
    },
  });

  saveState(state);
  return structuredClone(session);
}

export async function createSession(
  input: CreateSessionInput,
  actorTeacherId: string,
): Promise<Session> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);

  assertCanManageSessions(actor);

  assertValidSessionInput(input);

  const now = new Date().toISOString();
  const normalizedInput = normalizeSessionInput(input);
  const session: Session = {
    id: createId('session'),
    ...normalizedInput,
    createdAt: now,
    updatedAt: now,
  };

  state.sessions.push(session);

  addChange(state, {
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

  saveState(state);
  return structuredClone(session);
}

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
  actorTeacherId: string,
): Promise<Session> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  const session = findSession(state, sessionId);

  assertCanManageSessions(actor);

  if (!session) {
    throw new Error('Cannot update an unknown session.');
  }

  assertValidSessionInput(input);

  const previousSession = structuredClone(session);
  const normalizedInput = normalizeSessionInput(input);
  const nextSession: Session = {
    ...session,
    ...normalizedInput,
    updatedAt: new Date().toISOString(),
  };

  Object.assign(session, nextSession);

  addChange(state, {
    sessionId,
    actorTeacherId,
    type: 'session_updated',
    description: describeSessionUpdate(actor.name, previousSession, session),
    metadata: {
      previousSession,
      nextSession: structuredClone(session),
    },
  });

  saveState(state);
  return structuredClone(session);
}

export async function deleteSession(sessionId: string, actorTeacherId: string): Promise<Session> {
  const state = loadState();
  const actor = findTeacher(state, actorTeacherId);
  const session = findSession(state, sessionId);

  assertCanManageSessions(actor);

  if (!session) {
    throw new Error('Cannot delete an unknown session.');
  }

  const deletedSession = structuredClone(session);
  state.sessions = state.sessions.filter((item) => item.id !== sessionId);
  state.availability = state.availability.filter((item) => item.sessionId !== sessionId);

  addChange(state, {
    actorTeacherId,
    type: 'session_deleted',
    description: `${actor.name} a supprimé le ${formatSessionForDelete(deletedSession)}.`,
    metadata: {
      deletedSession,
    },
  });

  saveState(state);
  return deletedSession;
}

export async function resetMockData(): Promise<DojoDataState> {
  const state = cloneState(mockDojoData);
  saveState(state);
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(NOTIFICATION_READ_STORAGE_KEY);
    window.localStorage.removeItem(FORUM_MESSAGES_STORAGE_KEY);
    window.localStorage.removeItem(FORUM_READ_STORAGE_KEY);
    window.localStorage.removeItem(PUSH_SUBSCRIPTIONS_STORAGE_KEY);
  }
  return toSnapshot(state);
}
