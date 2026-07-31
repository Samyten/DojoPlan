import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateSessionInput, Session } from '../../types';
import {
  bulkUpdateAvailability,
  createForumMessage,
  createTeacher,
  createSession,
  deleteSession,
  deletePushSubscription,
  deleteTeacher,
  getDojoDataSnapshot,
  getForumMessages,
  getForumReadAt,
  getNotificationReadAt,
  getRecentChanges,
  markNotificationsRead,
  markForumRead,
  reorderTeachers,
  resetMockData,
  savePushSubscription,
  updateAvailability,
  updateLessonPlan,
  updateSession,
  updateTeacherRole,
} from './localDojoRepository';

const adminId = 'teacher-marc-piperno';
const superAdminId = 'teacher-samy-belkacemi';
const teacherId = 'teacher-christian-martinez';
const localStorageKey = 'dojo-planning.mock-state.v8';

const validSessionInput: CreateSessionInput = {
  title: 'Stage kata',
  date: '2026-06-13',
  startTime: '14:00',
  endTime: '16:00',
  location: 'Dojo principal',
  lessonPlan: 'Kata Heian et corrections individuelles.',
  notes: 'Prévoir les carnets de grade.',
};

beforeEach(async () => {
  window.localStorage.clear();
  await resetMockData();
});

describe('dojoRepository teacher management', () => {
  it('allows the super admin to add teachers and change roles', async () => {
    const teacher = await createTeacher(
      {
        name: 'Nouveau Professeur',
        email: 'nouveau.professeur@dojo.local',
        role: 'teacher',
      },
      superAdminId,
    );
    const promotedTeacher = await updateTeacherRole(teacher.id, 'admin', superAdminId);
    const snapshot = getDojoDataSnapshot();

    expect(promotedTeacher.role).toBe('admin');
    expect(snapshot.teachers.find((item) => item.id === teacher.id)?.role).toBe('admin');
  });

  it('allows the super admin to remove teachers and their availability', async () => {
    const session = firstSession();
    await updateAvailability(session.id, teacherId, 'present', '');
    const deletedTeacher = await deleteTeacher(teacherId, superAdminId);
    const snapshot = getDojoDataSnapshot();

    expect(deletedTeacher.id).toBe(teacherId);
    expect(snapshot.teachers.some((teacher) => teacher.id === teacherId)).toBe(false);
    expect(snapshot.availability.some((availability) => availability.teacherId === teacherId)).toBe(false);
  });

  it('rejects teacher management by regular admins and protects the super admin', async () => {
    await expect(
      createTeacher(
        {
          name: 'Refusé',
          email: 'refuse@dojo.local',
          role: 'teacher',
        },
        adminId,
      ),
    ).rejects.toThrow('Only the super admin');

    await expect(deleteTeacher(superAdminId, superAdminId)).rejects.toThrow('super admin');
    await expect(updateTeacherRole(superAdminId, 'teacher', superAdminId)).rejects.toThrow('super admin');
  });

  it('allows the super admin to reorder teachers and persists the order', async () => {
    const before = getDojoDataSnapshot().teachers;
    const nextOrder = [before[1].id, before[0].id, ...before.slice(2).map((teacher) => teacher.id)];

    const reorderedTeachers = await reorderTeachers(nextOrder, superAdminId);
    const snapshot = getDojoDataSnapshot();

    expect(reorderedTeachers.map((teacher) => teacher.id)).toEqual(nextOrder);
    expect(snapshot.teachers.map((teacher) => teacher.id)).toEqual(nextOrder);
    expect(snapshot.teachers[0].displayOrder).toBe(1);
    expect(snapshot.teachers[1].displayOrder).toBe(2);
  });

  it('rejects teacher reordering by admins and normal teachers', async () => {
    const nextOrder = getDojoDataSnapshot().teachers.map((teacher) => teacher.id).reverse();

    await expect(reorderTeachers(nextOrder, adminId)).rejects.toThrow('Only the super admin');
    await expect(reorderTeachers(nextOrder, teacherId)).rejects.toThrow('Only the super admin');
  });

  it('uses alphabetical teacher order when display order is not set', () => {
    const snapshot = getDojoDataSnapshot();
    const stateWithoutDisplayOrder = {
      ...snapshot,
      teachers: [
        { ...snapshot.teachers[0], displayOrder: undefined },
        { ...snapshot.teachers[1], displayOrder: undefined },
      ],
    };

    window.localStorage.setItem(localStorageKey, JSON.stringify(stateWithoutDisplayOrder));

    expect(getDojoDataSnapshot().teachers.map((teacher) => teacher.name)).toEqual([
      'Christian Martinez',
      'Marc Piperno',
    ]);
  });
});

describe('dojoRepository session creation', () => {
  it('allows an admin to create a session and logs the change', async () => {
    const createdSession = await createSession(validSessionInput, adminId);
    const snapshot = getDojoDataSnapshot();

    expect(snapshot.sessions.some((session) => session.id === createdSession.id)).toBe(true);
    expect(createdSession.title).toBe('Stage kata');
    expect(snapshot.changes[0]).toMatchObject({
      sessionId: createdSession.id,
      actorTeacherId: adminId,
      type: 'session_created',
    });
    expect(snapshot.changes[0].description).toContain('a ajouté un nouveau cours : Stage kata');
  });

  it('rejects session creation by a normal teacher', async () => {
    await expect(createSession(validSessionInput, teacherId)).rejects.toThrow('Only admins');
  });

  it('rejects invalid session data', async () => {
    await expect(
      createSession({ ...validSessionInput, endTime: '13:00' }, adminId),
    ).rejects.toThrow("L'heure de fin doit être après l'heure de début.");
  });
});

describe('dojoRepository session updates', () => {
  it('allows an admin to update a session and logs a French edit entry', async () => {
    const session = firstSession();
    const beforeSnapshot = getDojoDataSnapshot();
    const updatedSession = await updateSession(
      session.id,
      {
        title: 'Cours adultes avancés',
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        location: 'Dojo secondaire',
        lessonPlan: 'Kihon avancé et kumite.',
        notes: 'Prévoir protections.',
      },
      adminId,
    );
    const afterSnapshot = getDojoDataSnapshot();

    expect(updatedSession.title).toBe('Cours adultes avancés');
    expect(updatedSession.location).toBe('Dojo secondaire');
    expect(afterSnapshot.sessions.find((item) => item.id === session.id)?.title).toBe('Cours adultes avancés');
    expect(afterSnapshot.changes[0].type).toBe('session_updated');
    expect(afterSnapshot.changes[0].description).toContain('a modifié');
    expect(beforeSnapshot.sessions.find((item) => item.id === session.id)?.title).toBe(session.title);
  });

  it('logs a French move entry when date or time changes', async () => {
    const session = firstSession();
    await updateSession(
      session.id,
      {
        ...toInput(session),
        date: '2026-06-14',
      },
      adminId,
    );

    expect(getDojoDataSnapshot().changes[0].description).toContain('a déplacé');
  });

  it('rejects session updates by a normal teacher', async () => {
    const session = firstSession();
    await expect(updateSession(session.id, toInput(session), teacherId)).rejects.toThrow('Only admins');
  });
});

describe('dojoRepository session deletion', () => {
  it('allows an admin to delete a session, removes availability, and logs the change', async () => {
    const sessionWithAvailability = firstSession();
    await updateAvailability(sessionWithAvailability.id, teacherId, 'present', 'Disponible.');
    const deletedSession = await deleteSession(sessionWithAvailability.id, adminId);
    const snapshot = getDojoDataSnapshot();

    expect(deletedSession.id).toBe(sessionWithAvailability.id);
    expect(snapshot.sessions.some((session) => session.id === sessionWithAvailability.id)).toBe(false);
    expect(snapshot.availability.some((availability) => availability.sessionId === sessionWithAvailability.id)).toBe(false);
    expect(snapshot.changes[0]).toMatchObject({
      actorTeacherId: adminId,
      type: 'session_deleted',
    });
    expect(snapshot.changes[0].description).toContain('a supprimé le');
  });

  it('rejects session deletion by a normal teacher', async () => {
    await expect(deleteSession(firstSession().id, teacherId)).rejects.toThrow('Only admins');
  });

  it('throws a repository-level error when deleting an unknown session', async () => {
    await expect(deleteSession('missing-session', adminId)).rejects.toThrow('Cannot delete an unknown session.');
  });
});

describe('dojoRepository availability updates', () => {
  it('saves a teacher availability status/comment and logs natural French text', async () => {
    const session = firstSession();
    const beforeSnapshot = getDojoDataSnapshot();
    const availability = await updateAvailability(
      session.id,
      teacherId,
      'absent',
      'Je suis en déplacement.',
    );
    const afterSnapshot = getDojoDataSnapshot();

    expect(availability.status).toBe('absent');
    expect(availability.comment).toBe('Je suis en déplacement.');
    expect(afterSnapshot.availability.find((item) => item.id === availability.id)?.status).toBe('absent');
    expect(afterSnapshot.changes[0].type).toBe('availability_changed');
    expect(afterSnapshot.changes[0].description).toContain("a indiqué qu'il sera absent");
    expect(beforeSnapshot.availability.find((item) => item.id === availability.id)).toBeUndefined();
  });

  it('allows an admin to update another teacher availability', async () => {
    const session = firstSession();
    const availability = await updateAvailability(
      session.id,
      teacherId,
      'absent',
      'Indisponible.',
      adminId,
    );
    const snapshot = getDojoDataSnapshot();

    expect(availability.teacherId).toBe(teacherId);
    expect(availability.status).toBe('absent');
    expect(snapshot.changes[0].description).toContain('Marc Piperno a indiqué que Christian Martinez sera absent');
  });

  it('rejects individual on-behalf availability updates by a normal teacher', async () => {
    const session = firstSession();

    await expect(
      updateAvailability(session.id, adminId, 'absent', '', teacherId),
    ).rejects.toThrow('Only admins can update availability for another teacher');
  });
});

describe('dojoRepository bulk availability updates', () => {
  it('allows a teacher to bulk-update their own availability', async () => {
    const wednesdaySessions = sessionsForWeekday(3).slice(0, 3);
    const result = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: teacherId,
      sessionIds: wednesdaySessions.map((session) => session.id),
      status: 'absent',
      comment: 'Jamais disponible le mercredi.',
      overwriteExisting: false,
    });
    const snapshot = getDojoDataSnapshot();

    expect(result.updatedCount).toBe(3);
    expect(
      snapshot.availability.filter((availability) => availability.teacherId === teacherId),
    ).toHaveLength(3);
    expect(snapshot.changes[0].description).toContain('a renseigné 3 disponibilités');
  });

  it('rejects bulk availability for another teacher by a normal teacher', async () => {
    const sessions = sessionsForWeekday(1).slice(0, 2);

    await expect(
      bulkUpdateAvailability({
        targetTeacherId: adminId,
        actorTeacherId: teacherId,
        sessionIds: sessions.map((session) => session.id),
        status: 'absent',
        overwriteExisting: false,
      }),
    ).rejects.toThrow('Only admins can update availability for another teacher');
  });

  it('allows admin and super admin to bulk-update another teacher', async () => {
    const adminSessions = sessionsForWeekday(1).slice(0, 2);
    const superAdminSessions = sessionsForWeekday(4).slice(0, 2);

    const adminResult = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: adminId,
      sessionIds: adminSessions.map((session) => session.id),
      status: 'maybe',
      overwriteExisting: false,
    });
    const superAdminResult = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: superAdminId,
      sessionIds: superAdminSessions.map((session) => session.id),
      status: 'present',
      overwriteExisting: false,
    });

    expect(adminResult.updatedCount).toBe(2);
    expect(superAdminResult.updatedCount).toBe(2);
    expect(getDojoDataSnapshot().changes[0].description).toContain('Samy Belkacemi a renseigné 2 disponibilités');
  });

  it('preserves explicit existing availability unless overwrite is enabled', async () => {
    const sessions = sessionsForWeekday(1).slice(0, 2);
    await updateAvailability(sessions[0].id, teacherId, 'present', 'Déjà répondu.');

    const preservedResult = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: teacherId,
      sessionIds: sessions.map((session) => session.id),
      status: 'absent',
      overwriteExisting: false,
    });

    expect(preservedResult.updatedCount).toBe(1);
    expect(preservedResult.skippedCount).toBe(1);
    expect(
      getDojoDataSnapshot().availability.find((availability) => availability.sessionId === sessions[0].id)?.status,
    ).toBe('present');

    const overwriteResult = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: teacherId,
      sessionIds: sessions.map((session) => session.id),
      status: 'absent',
      overwriteExisting: true,
    });

    expect(overwriteResult.updatedCount).toBe(2);
    expect(
      getDojoDataSnapshot().availability.find((availability) => availability.sessionId === sessions[0].id)?.status,
    ).toBe('absent');
  });

  it('returns a sensible result when no sessions match', async () => {
    const result = await bulkUpdateAvailability({
      targetTeacherId: teacherId,
      actorTeacherId: teacherId,
      sessionIds: [],
      status: 'absent',
      overwriteExisting: false,
    });

    expect(result).toMatchObject({
      matchedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
    });
    expect(getDojoDataSnapshot().changes).toHaveLength(0);
  });
});

describe('dojoRepository lesson content updates', () => {
  it('saves lesson content, creates a recent change, and keeps previous snapshots stable', async () => {
    const session = firstSession();
    const beforeSnapshot = getDojoDataSnapshot();
    const updatedSession = await updateLessonPlan(
      session.id,
      'Kihon, kata et préparation examen.',
      adminId,
    );
    const afterSnapshot = getDojoDataSnapshot();

    expect(updatedSession.lessonPlan).toBe('Kihon, kata et préparation examen.');
    expect(afterSnapshot.sessions.find((item) => item.id === session.id)?.lessonPlan).toBe(
      'Kihon, kata et préparation examen.',
    );
    expect(afterSnapshot.changes[0].type).toBe('lesson_plan_added');
    expect(afterSnapshot.changes[0].description).toContain('a ajouté le contenu');
    expect(beforeSnapshot.sessions.find((item) => item.id === session.id)?.lessonPlan).toBe(session.lessonPlan);
  });

  it('allows clearing lesson content and logs the update', async () => {
    const session = firstSession();
    await updateLessonPlan(session.id, 'Kihon, kata et préparation examen.', adminId);
    const updatedSession = await updateLessonPlan(session.id, '   ', adminId);
    const snapshot = getDojoDataSnapshot();

    expect(updatedSession.lessonPlan).toBe('');
    expect(snapshot.sessions.find((item) => item.id === session.id)?.lessonPlan).toBe('');
    expect(snapshot.changes[0].type).toBe('lesson_plan_updated');
  });
});

describe('dojoRepository notification read state', () => {
  it('persists read state separately for each teacher and never moves it backwards', async () => {
    await createSession(validSessionInput, adminId);
    const [latestChange] = await getRecentChanges();

    expect(await getNotificationReadAt(teacherId)).toBeUndefined();

    const savedReadAt = await markNotificationsRead(teacherId, latestChange.createdAt);

    expect(savedReadAt).toBe(latestChange.createdAt);
    expect(await getNotificationReadAt(teacherId)).toBe(latestChange.createdAt);
    expect(await getNotificationReadAt(adminId)).toBeUndefined();

    const olderTimestamp = '2020-01-01T00:00:00.000Z';
    await markNotificationsRead(teacherId, olderTimestamp);
    expect(await getNotificationReadAt(teacherId)).toBe(latestChange.createdAt);
  });
});

describe('dojoRepository forum messages', () => {
  it('allows teachers, admins, and the super admin to post persistent messages', async () => {
    await createForumMessage('Message de Christian.', teacherId);
    await createForumMessage('Message de Marc.', adminId);
    await createForumMessage('Message de Samy.', superAdminId);

    const messages = await getForumMessages();

    expect(messages).toHaveLength(3);
    expect(messages.map((message) => message.authorName)).toEqual([
      'Christian Martinez',
      'Marc Piperno',
      'Samy Belkacemi',
    ]);
    expect(messages[0]).toMatchObject({
      teacherId,
      message: 'Message de Christian.',
    });
    expect(new Date(messages[0].createdAt).toString()).not.toBe('Invalid Date');
  });

  it('does not mutate previously returned message snapshots', async () => {
    const previousMessages = await getForumMessages();
    await createForumMessage('Information importante.', teacherId);
    const currentMessages = await getForumMessages();

    expect(previousMessages).toHaveLength(0);
    expect(currentMessages).toHaveLength(1);

    currentMessages[0].message = 'Texte modifié uniquement dans le test.';
    expect((await getForumMessages())[0].message).toBe('Information importante.');
  });

  it('rejects empty and oversized messages', async () => {
    await expect(createForumMessage('   ', teacherId)).rejects.toThrow('between 1 and 2000');
    await expect(createForumMessage('a'.repeat(2001), teacherId)).rejects.toThrow(
      'between 1 and 2000',
    );
    expect(await getForumMessages()).toHaveLength(0);
  });

  it('keeps an individual Forum read marker for each teacher', async () => {
    const message = await createForumMessage('Information à lire.', adminId);

    expect(await getForumReadAt(teacherId)).toBeUndefined();

    const savedReadAt = await markForumRead(teacherId, message.createdAt);

    expect(savedReadAt).toBe(message.createdAt);
    expect(await getForumReadAt(teacherId)).toBe(message.createdAt);
    expect(await getForumReadAt(adminId)).toBeUndefined();

    await markForumRead(teacherId, '2020-01-01T00:00:00.000Z');
    expect(await getForumReadAt(teacherId)).toBe(message.createdAt);
  });
});

describe('dojoRepository push subscriptions', () => {
  it('stores and removes a device subscription for a known teacher in local mode', async () => {
    const subscription = {
      endpoint: 'https://push.example.test/subscription-1',
      p256dh: 'public-encryption-key',
      auth: 'authentication-secret',
    };

    await savePushSubscription(subscription, teacherId);

    expect(
      JSON.parse(window.localStorage.getItem('dojo-planning.push-subscriptions.v1') ?? '[]'),
    ).toEqual([{ ...subscription, teacherId }]);

    await deletePushSubscription(subscription.endpoint, teacherId);
    expect(
      JSON.parse(window.localStorage.getItem('dojo-planning.push-subscriptions.v1') ?? '[]'),
    ).toEqual([]);
  });

  it('rejects subscriptions for an unknown teacher', async () => {
    await expect(
      savePushSubscription(
        {
          endpoint: 'https://push.example.test/unknown',
          p256dh: 'public-encryption-key',
          auth: 'authentication-secret',
        },
        'teacher-inconnu',
      ),
    ).rejects.toThrow('unknown teacher');
  });
});

function firstSession() {
  const session = getDojoDataSnapshot().sessions[0];

  if (!session) {
    throw new Error('Expected mock sessions to exist.');
  }

  return session;
}

function sessionsForWeekday(day: number) {
  return getDojoDataSnapshot().sessions.filter(
    (session) => new Date(`${session.date}T00:00:00`).getDay() === day,
  );
}

function toInput(session: Session): CreateSessionInput {
  return {
    title: session.title,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    lessonPlan: session.lessonPlan,
    notes: session.notes,
  };
}
