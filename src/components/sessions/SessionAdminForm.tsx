import { useState } from 'react';
import type { CreateSessionInput, Session } from '../../types';
import { getHolidayInfo } from '../../data/holidayCalendar';
import { validateSessionInput } from '../../utils/sessionValidation';

interface SessionAdminFormProps {
  submitLabel: string;
  isSaving: boolean;
  initialSession?: Session;
  onSubmit: (input: CreateSessionInput) => Promise<void>;
}

export function SessionAdminForm({
  submitLabel,
  isSaving,
  initialSession,
  onSubmit,
}: SessionAdminFormProps) {
  const [error, setError] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState(initialSession?.date ?? '');
  const selectedHoliday = selectedDate ? getHolidayInfo(selectedDate) : undefined;

  return (
    <form
      className="admin-session-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const input = getSessionInput(new FormData(event.currentTarget));
        const validationError = validateSessionInput(input);

        if (validationError) {
          setError(validationError);
          return;
        }

        setError(undefined);
        await onSubmit(input);

        if (!initialSession) {
          event.currentTarget.reset();
        }
      }}
    >
      {error ? <p className="form-error">{error}</p> : null}
      {selectedHoliday ? (
        <p className="form-context form-context--changed">
          Attention : cette date tombe pendant {selectedHoliday.labels.join(' · ')}. Le cours peut être
          enregistré si vous souhaitez maintenir une séance exceptionnelle.
        </p>
      ) : null}

      <label className="field">
        <span>Titre du cours</span>
        <input name="title" defaultValue={initialSession?.title ?? ''} placeholder="Stage kata" />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Début</span>
          <input name="startTime" defaultValue={initialSession?.startTime ?? ''} type="time" />
        </label>
        <label className="field">
          <span>Fin</span>
          <input name="endTime" defaultValue={initialSession?.endTime ?? ''} type="time" />
        </label>
        <label className="field">
          <span>Date</span>
          <input
            name="date"
            defaultValue={initialSession?.date ?? ''}
            type="date"
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Lieu</span>
        <input name="location" defaultValue={initialSession?.location ?? ''} placeholder="Dojo principal" />
      </label>

      <label className="field">
        <span>Contenu du cours</span>
        <textarea
          name="lessonPlan"
          defaultValue={initialSession?.lessonPlan ?? ''}
          rows={4}
        />
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea
          name="notes"
          defaultValue={initialSession?.notes ?? ''}
          rows={3}
          placeholder="Informations utiles pour les professeurs"
        />
      </label>

      <button className="secondary-button" type="submit" disabled={isSaving}>
        {isSaving ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  );
}

function getSessionInput(formData: FormData): CreateSessionInput {
  return {
    title: String(formData.get('title') ?? ''),
    date: String(formData.get('date') ?? ''),
    startTime: String(formData.get('startTime') ?? ''),
    endTime: String(formData.get('endTime') ?? ''),
    location: String(formData.get('location') ?? ''),
    lessonPlan: String(formData.get('lessonPlan') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  };
}
