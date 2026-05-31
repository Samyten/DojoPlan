import type { AvailabilityStatus } from '../../types';

const statusLabels: Record<AvailabilityStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  maybe: 'Peut-être',
  unknown: 'Non renseigné',
};

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabels[status]}</span>;
}
