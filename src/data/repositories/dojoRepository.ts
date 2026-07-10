import * as localRepository from './localDojoRepository';
import * as supabaseRepository from './supabaseDojoRepository';
import type { DojoRepository } from './repositoryTypes';
import { getDataBackend } from '../../config/dataBackend';

function getRepository(): DojoRepository {
  return getDataBackend() === 'supabase' ? supabaseRepository : localRepository;
}

export const getTeachers: DojoRepository['getTeachers'] = (...args) =>
  getRepository().getTeachers(...args);

export const getSessions: DojoRepository['getSessions'] = (...args) =>
  getRepository().getSessions(...args);

export const getAvailabilityForSession: DojoRepository['getAvailabilityForSession'] = (...args) =>
  getRepository().getAvailabilityForSession(...args);

export const getAllAvailability: DojoRepository['getAllAvailability'] = (...args) =>
  getRepository().getAllAvailability(...args);

export const getRecentChanges: DojoRepository['getRecentChanges'] = (...args) =>
  getRepository().getRecentChanges(...args);

export const getNotificationReadAt: DojoRepository['getNotificationReadAt'] = (...args) =>
  getRepository().getNotificationReadAt(...args);

export const markNotificationsRead: DojoRepository['markNotificationsRead'] = (...args) =>
  getRepository().markNotificationsRead(...args);

export const getDojoData: DojoRepository['getDojoData'] = (...args) =>
  getRepository().getDojoData(...args);

export const getDojoDataSnapshot: DojoRepository['getDojoDataSnapshot'] = (...args) =>
  getRepository().getDojoDataSnapshot(...args);

export const createTeacher: DojoRepository['createTeacher'] = (...args) =>
  getRepository().createTeacher(...args);

export const updateTeacherRole: DojoRepository['updateTeacherRole'] = (...args) =>
  getRepository().updateTeacherRole(...args);

export const reorderTeachers: DojoRepository['reorderTeachers'] = (...args) =>
  getRepository().reorderTeachers(...args);

export const deleteTeacher: DojoRepository['deleteTeacher'] = (...args) =>
  getRepository().deleteTeacher(...args);

export const createSession: DojoRepository['createSession'] = (...args) =>
  getRepository().createSession(...args);

export const updateSession: DojoRepository['updateSession'] = (...args) =>
  getRepository().updateSession(...args);

export const deleteSession: DojoRepository['deleteSession'] = (...args) =>
  getRepository().deleteSession(...args);

export const updateAvailability: DojoRepository['updateAvailability'] = (...args) =>
  getRepository().updateAvailability(...args);

export const bulkUpdateAvailability: DojoRepository['bulkUpdateAvailability'] = (...args) =>
  getRepository().bulkUpdateAvailability(...args);

export const updateLessonPlan: DojoRepository['updateLessonPlan'] = (...args) =>
  getRepository().updateLessonPlan(...args);

export const resetMockData: DojoRepository['resetMockData'] = (...args) =>
  getRepository().resetMockData(...args);
