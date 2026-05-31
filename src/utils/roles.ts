import type { Teacher, TeacherRole } from '../types';

export function canManageSessions(teacher: Teacher | undefined) {
  return teacher?.role === 'admin' || teacher?.role === 'super_admin';
}

export function canManageTeachers(teacher: Teacher | undefined) {
  return teacher?.role === 'super_admin';
}

export function roleLabel(role: TeacherRole) {
  const labels: Record<TeacherRole, string> = {
    super_admin: 'super administrateur',
    admin: 'admin',
    teacher: 'professeur',
  };

  return labels[role];
}
