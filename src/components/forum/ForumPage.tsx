import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ForumMessage, Teacher } from '../../types';
import { formatForumTimestamp } from '../../utils/dates';

interface ForumPageProps {
  messages: ForumMessage[];
  currentTeacher?: Teacher;
  isLoading: boolean;
  isSending: boolean;
  error?: string;
  onRefresh: () => Promise<void>;
  onSendMessage: (message: string) => Promise<boolean>;
}

export function ForumPage({
  messages,
  currentTeacher,
  isLoading,
  isSending,
  error,
  onRefresh,
  onSendMessage,
}: ForumPageProps) {
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState<string | undefined>();
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();

    if (!message) {
      setFormError('Écrivez un message avant de l’envoyer.');
      return;
    }

    if (message.length > 2000) {
      setFormError('Le message ne peut pas dépasser 2 000 caractères.');
      return;
    }

    setFormError(undefined);
    if (await onSendMessage(message)) {
      setDraft('');
    }
  }

  return (
    <section className="panel forum-page" aria-labelledby="forum-heading">
      <div className="panel-heading forum-heading">
        <div>
          <p className="eyebrow">Échanges</p>
          <h2 id="forum-heading">Forum</h2>
          <p className="forum-heading__description">
            Informations importantes partagées entre les professeurs.
          </p>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={isLoading}
          onClick={() => void onRefresh()}
        >
          {isLoading ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {error ? <p className="form-error forum-error">{error}</p> : null}

      <div
        className="forum-message-list"
        ref={messageListRef}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading && !messages.length ? <p className="empty-state">Chargement des messages...</p> : null}
        {!isLoading && !messages.length ? (
          <p className="empty-state">Aucun message pour le moment.</p>
        ) : null}
        {messages.map((message) => (
          <article className="forum-message" key={message.id}>
            <div className="forum-message__meta">
              <strong>{message.authorName}</strong>
              <time dateTime={message.createdAt}>{formatForumTimestamp(message.createdAt)}</time>
            </div>
            <p>{message.message}</p>
          </article>
        ))}
      </div>

      <form className="forum-composer" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <h3>Écrire un message</h3>
          {currentTeacher ? <small>Publié en tant que {currentTeacher.name}</small> : null}
        </div>
        <label className="field">
          <span>Message</span>
          <textarea
            value={draft}
            maxLength={2000}
            rows={4}
            disabled={isSending || !currentTeacher}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <div className="forum-composer__actions">
          <small>{draft.length} / 2 000</small>
          <button
            className="primary-button"
            type="submit"
            disabled={isSending || !currentTeacher || !draft.trim()}
          >
            {isSending ? 'Envoi...' : 'Envoyer le message'}
          </button>
        </div>
        {formError ? <p className="form-error">{formError}</p> : null}
      </form>
    </section>
  );
}
