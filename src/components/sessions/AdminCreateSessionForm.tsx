import { useState } from 'react';
import type { CreateSessionInput, Session, UpdateSessionInput } from '../../types';
import { formatLongDate } from '../../utils/dates';
import { SessionAdminForm } from './SessionAdminForm';

interface AdminCreateSessionFormProps {
  selectedSession: Session | undefined;
  isSaving: boolean;
  onCreateSession: (input: CreateSessionInput) => Promise<void>;
  onUpdateSession: (sessionId: string, input: UpdateSessionInput) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

export function AdminCreateSessionForm({
  selectedSession,
  isSaving,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
}: AdminCreateSessionFormProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | undefined>();
  const isEditingSelectedSession = Boolean(selectedSession && editingSessionId === selectedSession.id);

  return (
    <details className="panel admin-create-panel" aria-labelledby="admin-sessions-heading">
      <summary className="panel-heading admin-panel-summary">
        <div>
          <p className="eyebrow">Administration</p>
          <h2 id="admin-sessions-heading">Gestion des cours</h2>
        </div>
      </summary>

      <div className="admin-course-section">
        <div className="detail-section-heading">
          <p className="eyebrow">Cours sélectionné</p>
          {selectedSession ? (
            <h3>
              {selectedSession.title} — {formatLongDate(selectedSession.date)}
            </h3>
          ) : (
            <p className="empty-state">
              Sélectionnez un cours dans le calendrier pour le modifier ou le supprimer.
            </p>
          )}
        </div>

        {selectedSession ? (
          <>
            <div className="admin-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setEditingSessionId((current) =>
                    current === selectedSession.id ? undefined : selectedSession.id,
                  )
                }
              >
                {isEditingSelectedSession ? "Fermer l'édition" : 'Modifier le cours sélectionné'}
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  const confirmed = window.confirm(
                    `Supprimer ${selectedSession.title} du ${formatLongDate(selectedSession.date)} ? Cette action retirera aussi les disponibilités associées.`,
                  );

                  if (confirmed) {
                    await onDeleteSession(selectedSession.id);
                  }
                }}
              >
                Supprimer le cours sélectionné
              </button>
            </div>

            {isEditingSelectedSession ? (
              <div className="admin-edit-form">
                <SessionAdminForm
                  key={selectedSession.id}
                  submitLabel="Enregistrer les modifications"
                  isSaving={isSaving}
                  initialSession={selectedSession}
                  onSubmit={async (input) => {
                    await onUpdateSession(selectedSession.id, input);
                    setEditingSessionId(undefined);
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="admin-course-section">
        <div className="inline-heading">
          <div>
            <p className="eyebrow">Cours exceptionnel</p>
            <h3>Ajouter un cours exceptionnel</h3>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => setIsCreateOpen((current) => !current)}
          >
            {isCreateOpen ? 'Fermer' : 'Créer un cours'}
          </button>
        </div>

        {isCreateOpen ? (
          <div className="admin-create-form">
            <SessionAdminForm
              submitLabel="Créer le cours"
              isSaving={isSaving}
              onSubmit={async (input) => {
                await onCreateSession(input);
                setIsCreateOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}
