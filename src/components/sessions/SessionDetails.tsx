import { useState } from 'react';
import type { Availability, AvailabilityStatus, Session, Teacher } from '../../types';
import { formatLongDate, formatTimeRange, formatTimestamp } from '../../utils/dates';
import { StatusBadge } from '../ui/StatusBadge';
import { AvailabilityEditor } from './AvailabilityEditor';

interface SessionDetailsProps {
  session: Session | undefined;
  teachers: Teacher[];
  availability: Availability[];
  currentTeacher: Teacher | undefined;
  isSaving: boolean;
  onSaveAvailability: (status: AvailabilityStatus, comment: string) => void;
  onSaveLessonPlan: (lessonPlan: string) => void;
}

export function SessionDetails({
  session,
  teachers,
  availability,
  currentTeacher,
  isSaving,
  onSaveAvailability,
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
