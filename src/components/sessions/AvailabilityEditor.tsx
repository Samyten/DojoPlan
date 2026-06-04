import type { Availability, AvailabilityStatus, Teacher } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

const statusOptions: AvailabilityStatus[] = ['present', 'absent', 'maybe', 'unknown'];

const statusLabels: Record<AvailabilityStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  maybe: 'Peut-être',
  unknown: 'Non renseigné',
};

interface AvailabilityEditorProps {
  sessionTitle: string;
  currentTeacher: Teacher;
  availability: Availability | undefined;
  isSaving: boolean;
  onSubmit: (status: AvailabilityStatus, comment: string) => void;
}

export function AvailabilityEditor({
  sessionTitle,
  currentTeacher,
  availability,
  isSaving,
  onSubmit,
}: AvailabilityEditorProps) {
  const selectedStatus = availability?.status ?? 'unknown';

  return (
    <form
      className="availability-editor"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit(formData.get('status') as AvailabilityStatus, '');
      }}
    >
      <div className="inline-heading">
        <div>
          <p className="eyebrow">Votre disponibilité pour {sessionTitle}</p>
          <h3>{currentTeacher.name}</h3>
        </div>
        <StatusBadge status={selectedStatus} />
      </div>

      <fieldset className="status-options">
        <legend>Statut de disponibilité</legend>
        {statusOptions.map((status) => (
          <label key={status} className="status-option">
            <input name="status" type="radio" value={status} defaultChecked={status === selectedStatus} />
            <span>{statusLabels[status]}</span>
          </label>
        ))}
      </fieldset>

      <button className="primary-button" type="submit" disabled={isSaving}>
        {isSaving ? 'Enregistrement...' : `Enregistrer ma disponibilité pour ${sessionTitle}`}
      </button>
    </form>
  );
}
