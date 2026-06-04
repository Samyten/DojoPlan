import { useState } from 'react';
import type {
  Availability,
  AvailabilityStatus,
  BulkAvailabilityResult,
  Session,
  Teacher,
} from '../../types';
import { formatLongDate, formatTimeRange, formatTimestamp } from '../../utils/dates';
import { canManageSessions } from '../../utils/roles';
import { StatusBadge } from '../ui/StatusBadge';
import { AvailabilityEditor } from './AvailabilityEditor';
import { BulkAvailabilityPanel } from './BulkAvailabilityPanel';

const statusOptions: AvailabilityStatus[] = ['present', 'absent', 'maybe', 'unknown'];

const statusLabels: Record<AvailabilityStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  maybe: 'Peut-être',
  unknown: 'Non renseigné',
};

interface SessionDetailsProps {
  session: Session | undefined;
  sessions: Session[];
  teachers: Teacher[];
  availability: Availability[];
  allAvailability: Availability[];
  currentTeacher: Teacher | undefined;
  isSaving: boolean;
  onSaveAvailability: (status: AvailabilityStatus, comment: string) => void;
  onSaveAvailabilityForTeacher: (
    teacherId: string,
    status: AvailabilityStatus,
    comment: string,
  ) => Promise<void>;
  onBulkUpdateAvailability: (input: {
    targetTeacherId: string;
    sessionIds: string[];
    status: AvailabilityStatus;
    comment: string;
    overwriteExisting: boolean;
  }) => Promise<BulkAvailabilityResult | undefined>;
  onSaveLessonPlan: (lessonPlan: string) => void;
}

export function SessionDetails({
  session,
  sessions,
  teachers,
  availability,
  allAvailability,
  currentTeacher,
  isSaving,
  onSaveAvailability,
  onSaveAvailabilityForTeacher,
  onBulkUpdateAvailability,
  onSaveLessonPlan,
}: SessionDetailsProps) {
  if (!session || !currentTeacher) {
    return (
      <aside className="panel detail-panel">
        <p>Sélectionnez un cours dans le calendrier pour voir les détails.</p>
      </aside>
    );
  }

  const currentAvailability = availability.find((item) => item.teacherId === currentTeacher.id);
  const availabilityByTeacher = new Map(availability.map((item) => [item.teacherId, item]));
  const canEditOtherTeachers = canManageSessions(currentTeacher);

  return (
    <aside className="panel detail-panel" aria-labelledby="details-heading">
      <div className="session-detail-header">
        <p className="eyebrow">{formatLongDate(session.date)}</p>
        <h2 id="details-heading">{session.title}</h2>
        <p>
          {formatTimeRange(session.startTime, session.endTime)}
          {session.location ? ` · ${session.location}` : ''}
        </p>
      </div>

      <section className="detail-section">
        <div className="detail-section-heading">
          <p className="eyebrow">Préparation</p>
          <h3>Contenu du cours</h3>
        </div>
        <LessonPlanEditor
          key={`${session.id}-${session.updatedAt}`}
          session={session}
          currentTeacher={currentTeacher}
          isSaving={isSaving}
          onSaveLessonPlan={onSaveLessonPlan}
        />
      </section>

      <section className="detail-section">
        <div className="detail-section-heading">
          <p className="eyebrow">Votre présence</p>
          <h3>Disponibilité personnelle</h3>
        </div>
        <AvailabilityEditor
          key={`${session.id}-${currentTeacher.id}-${currentAvailability?.updatedAt ?? 'new'}`}
          sessionTitle={session.title}
          currentTeacher={currentTeacher}
          availability={currentAvailability}
          isSaving={isSaving}
          onSubmit={onSaveAvailability}
        />

        {canEditOtherTeachers ? (
          <AdminAvailabilityEditor
            session={session}
            teachers={teachers}
            availability={availability}
            currentTeacher={currentTeacher}
            isSaving={isSaving}
            onSaveAvailabilityForTeacher={onSaveAvailabilityForTeacher}
          />
        ) : null}

        <BulkAvailabilityPanel
          sessions={sessions}
          availability={allAvailability}
          teachers={teachers}
          currentTeacher={currentTeacher}
          isSaving={isSaving}
          onBulkUpdateAvailability={onBulkUpdateAvailability}
        />
      </section>

      <section className="detail-section">
        <div className="inline-heading detail-section-heading">
          <div>
            <p className="eyebrow">Équipe</p>
            <h3>Disponibilité des professeurs</h3>
          </div>
        </div>

        <div className="teacher-availability-list">
          {teachers.map((teacher) => {
            const teacherAvailability = availabilityByTeacher.get(teacher.id);

            return (
              <article key={teacher.id} className="teacher-availability-row">
                <div>
                  <strong>{teacher.name}</strong>
                  <small>{teacherAvailability?.comment || 'Aucun commentaire'}</small>
                </div>
                <StatusBadge status={teacherAvailability?.status ?? 'unknown'} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="detail-section muted-box">
        <p className="eyebrow">Notes</p>
        <p>{session.notes?.trim() ? session.notes : 'Aucune note pour le moment.'}</p>
        <small>Dernière mise à jour : {formatTimestamp(session.updatedAt)}</small>
      </section>
    </aside>
  );
}

interface AdminAvailabilityEditorProps {
  session: Session;
  teachers: Teacher[];
  availability: Availability[];
  currentTeacher: Teacher;
  isSaving: boolean;
  onSaveAvailabilityForTeacher: (
    teacherId: string,
    status: AvailabilityStatus,
    comment: string,
  ) => Promise<void>;
}

function AdminAvailabilityEditor({
  session,
  teachers,
  availability,
  currentTeacher,
  isSaving,
  onSaveAvailabilityForTeacher,
}: AdminAvailabilityEditorProps) {
  const otherTeachers = teachers.filter((teacher) => teacher.id !== currentTeacher.id);
  const [targetTeacherId, setTargetTeacherId] = useState(otherTeachers[0]?.id ?? teachers[0]?.id ?? '');
  const targetAvailability = availability.find((item) => item.teacherId === targetTeacherId);
  const selectedStatus = targetAvailability?.status ?? 'unknown';

  return (
    <details className="secondary-details">
      <summary>Modifier la disponibilité d'un professeur</summary>
      <form
        key={`${targetTeacherId}-${targetAvailability?.updatedAt ?? 'new'}`}
        className="availability-editor"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await onSaveAvailabilityForTeacher(
            String(formData.get('teacherId') ?? ''),
            formData.get('status') as AvailabilityStatus,
            String(formData.get('comment') ?? ''),
          );
        }}
      >
        <label className="field">
          <span>Professeur</span>
          <select
            name="teacherId"
            value={targetTeacherId}
            onChange={(event) => setTargetTeacherId(event.target.value)}
          >
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="status-options">
          <legend>Statut pour {session.title}</legend>
          {statusOptions.map((status) => (
            <label key={status} className="status-option">
              <input
                name="status"
                type="radio"
                value={status}
                defaultChecked={status === selectedStatus}
              />
              <span>{statusLabels[status]}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Commentaire</span>
          <input name="comment" defaultValue={targetAvailability?.comment ?? ''} placeholder="Note facultative" />
        </label>

        <button className="primary-button" type="submit" disabled={isSaving || !targetTeacherId}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer pour ce professeur'}
        </button>
      </form>
    </details>
  );
}

interface LessonPlanEditorProps {
  session: Session;
  currentTeacher: Teacher;
  isSaving: boolean;
  onSaveLessonPlan: (lessonPlan: string) => void;
}

function LessonPlanEditor({
  session,
  currentTeacher,
  isSaving,
  onSaveLessonPlan,
}: LessonPlanEditorProps) {
  const [lessonDraft, setLessonDraft] = useState(session.lessonPlan ?? '');
  const savedLessonPlan = session.lessonPlan ?? '';
  const lessonHasChanges = lessonDraft !== savedLessonPlan;

  return (
    <form
      className="lesson-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSaveLessonPlan(lessonDraft);
      }}
    >
      <label className="field">
        <span>Plan du cours</span>
        <textarea
          name="lessonPlan"
          value={lessonDraft}
          onChange={(event) => setLessonDraft(event.target.value)}
          rows={5}
        />
      </label>
      <p className={lessonHasChanges ? 'form-context form-context--changed' : 'form-context'}>
        {lessonHasChanges
          ? `Modifications non enregistrées pour ${session.title}.`
          : `Cet enregistrement modifiera ${session.title} avec ${currentTeacher.name}.`}
      </p>
      {!savedLessonPlan.trim() ? (
        <p className="empty-state">Aucun contenu de cours n'a encore été ajouté.</p>
      ) : null}
      <button className="secondary-button" type="submit" disabled={isSaving || !lessonHasChanges}>
        {isSaving ? 'Enregistrement...' : 'Enregistrer le contenu pour ce cours'}
      </button>
    </form>
  );
}
