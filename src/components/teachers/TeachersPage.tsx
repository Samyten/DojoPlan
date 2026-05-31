import { useState } from 'react';
import type { CreateTeacherInput, Teacher } from '../../types';
import { canManageTeachers, roleLabel } from '../../utils/roles';

interface TeachersPageProps {
  teachers: Teacher[];
  currentTeacher?: Teacher;
  isSaving: boolean;
  onCreateTeacher: (input: CreateTeacherInput) => Promise<void>;
  onUpdateTeacherRole: (teacherId: string, role: CreateTeacherInput['role']) => Promise<void>;
  onReorderTeachers: (orderedTeacherIds: string[]) => Promise<void>;
  onDeleteTeacher: (teacher: Teacher) => Promise<void>;
}

export function TeachersPage({
  teachers,
  currentTeacher,
  isSaving,
  onCreateTeacher,
  onUpdateTeacherRole,
  onReorderTeachers,
  onDeleteTeacher,
}: TeachersPageProps) {
  const [formError, setFormError] = useState<string | undefined>();
  const canManage = canManageTeachers(currentTeacher);

  return (
    <section className="panel teachers-page" aria-labelledby="teachers-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Équipe</p>
          <h2 id="teachers-heading">Professeurs</h2>
        </div>
        <span className="count-pill">{teachers.length}</span>
      </div>

      {canManage ? (
        <form
          className="teacher-management-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const input: CreateTeacherInput = {
              name: String(formData.get('name') ?? ''),
              email: String(formData.get('email') ?? ''),
              role: String(formData.get('role') ?? 'teacher') as CreateTeacherInput['role'],
            };

            if (!input.name.trim() || !input.email.trim()) {
              setFormError("Le nom et l'email sont obligatoires.");
              return;
            }

            setFormError(undefined);
            await onCreateTeacher(input);
            event.currentTarget.reset();
          }}
        >
          <div>
            <p className="eyebrow">Super administrateur</p>
            <h3>Ajouter un professeur</h3>
          </div>

          {formError ? <p className="form-error">{formError}</p> : null}

          <div className="form-grid teacher-form-grid">
            <label className="field">
              <span>Nom</span>
              <input name="name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" />
            </label>
            <label className="field">
              <span>Rôle</span>
              <select name="role" defaultValue="teacher">
                <option value="teacher">Professeur</option>
                <option value="admin">Administrateur</option>
              </select>
            </label>
          </div>

          <button className="secondary-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Ajouter le professeur'}
          </button>
        </form>
      ) : null}

      <div className="teacher-grid">
        {teachers.map((teacher, index) => {
          const isCurrentTeacher = currentTeacher?.id === teacher.id;
          const isProtectedSuperAdmin = teacher.role === 'super_admin';

          return (
            <article key={teacher.id} className="teacher-card">
              <div>
                <h3>{teacher.name}</h3>
              </div>
              <div className="teacher-card__footer">
                <span className="role-pill">{roleLabel(teacher.role)}</span>
              </div>

              {canManage ? (
                <div className="teacher-reorder-actions" aria-label={`Changer l'ordre de ${teacher.name}`}>
                  <button
                    className="text-button"
                    type="button"
                    disabled={isSaving || index === 0}
                    onClick={() => void onReorderTeachers(moveTeacher(teachers, index, index - 1))}
                  >
                    ↑ Monter
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    disabled={isSaving || index === teachers.length - 1}
                    onClick={() => void onReorderTeachers(moveTeacher(teachers, index, index + 1))}
                  >
                    ↓ Descendre
                  </button>
                </div>
              ) : null}

              {canManage && !isProtectedSuperAdmin ? (
                <div className="teacher-management-actions">
                  <label className="field">
                    <span>Rôle</span>
                    <select
                      value={teacher.role}
                      disabled={isSaving}
                      onChange={(event) =>
                        void onUpdateTeacherRole(
                          teacher.id,
                          event.target.value as CreateTeacherInput['role'],
                        )
                      }
                    >
                      <option value="teacher">Professeur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </label>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={isSaving || isCurrentTeacher}
                    onClick={() => void onDeleteTeacher(teacher)}
                  >
                    Retirer
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function moveTeacher(teachers: Teacher[], fromIndex: number, toIndex: number) {
  const nextTeachers = [...teachers];
  const [teacher] = nextTeachers.splice(fromIndex, 1);
  nextTeachers.splice(toIndex, 0, teacher);

  return nextTeachers.map((item) => item.id);
}
