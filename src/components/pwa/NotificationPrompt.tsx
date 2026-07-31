import { useEffect, useState } from 'react';
import { deletePushSubscription, savePushSubscription } from '../../data/repositories/dojoRepository';
import type { Teacher } from '../../types';
import { getFriendlyErrorMessage } from '../../utils/errors';
import {
  getPushSubscription,
  isInstalledApp,
  isPushSupported,
  serializePushSubscription,
  subscribeToPushNotifications,
} from '../../utils/pwa';

interface NotificationPromptProps {
  currentTeacher?: Teacher;
  isSupabaseMode: boolean;
}

type NotificationState =
  | 'checking'
  | 'needs-install'
  | 'available'
  | 'activating'
  | 'active'
  | 'disabling'
  | 'denied'
  | 'unsupported'
  | 'unconfigured'
  | 'error';

const DISMISSED_AT_KEY = 'dojo-planning.notification-prompt-dismissed-at.v1';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY));
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION;
}

export function NotificationPrompt({ currentTeacher, isSupabaseMode }: NotificationPromptProps) {
  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();
  const [installed, setInstalled] = useState(isInstalledApp);
  const [state, setState] = useState<NotificationState>('checking');
  const [error, setError] = useState<string>();
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const pushSupported = isPushSupported();
  const prerequisiteState: NotificationState | undefined = !pushSupported
    ? 'unsupported'
    : !publicKey
      ? 'unconfigured'
      : !installed
        ? 'needs-install'
        : Notification.permission === 'denied'
          ? 'denied'
          : undefined;
  const displayState = prerequisiteState ?? state;

  useEffect(() => {
    function handleInstalled() {
      setInstalled(true);
      setDismissed(false);
      window.localStorage.removeItem(DISMISSED_AT_KEY);
    }

    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  useEffect(() => {
    if (!isSupabaseMode || !currentTeacher) {
      return;
    }

    if (prerequisiteState) {
      return;
    }

    let cancelled = false;
    void getPushSubscription()
      .then(async (subscription) => {
        if (cancelled) {
          return;
        }

        if (!subscription) {
          setState('available');
          return;
        }

        await savePushSubscription(serializePushSubscription(subscription), currentTeacher.id);
        if (!cancelled) {
          setState('active');
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            getFriendlyErrorMessage(
              loadError,
              "L’état des notifications n’a pas pu être vérifié.",
            ),
          );
          setState('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTeacher, isSupabaseMode, prerequisiteState]);

  if (!isSupabaseMode || !currentTeacher) {
    return null;
  }

  async function handleEnable() {
    if (!publicKey || !currentTeacher) {
      return;
    }

    setState('activating');
    setError(undefined);

    let subscription: PushSubscription | undefined;
    try {
      subscription = await subscribeToPushNotifications(publicKey);
      await savePushSubscription(serializePushSubscription(subscription), currentTeacher.id);
      window.localStorage.removeItem(DISMISSED_AT_KEY);
      setDismissed(false);
      setState('active');
    } catch (enableError) {
      if (subscription) {
        await subscription.unsubscribe().catch(() => false);
      }

      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }

      setError(
        getFriendlyErrorMessage(enableError, "Les notifications n’ont pas pu être activées."),
      );
      setState('error');
    }
  }

  async function handleDisable() {
    if (!currentTeacher) {
      return;
    }

    setState('disabling');
    setError(undefined);

    try {
      const subscription = await getPushSubscription();

      if (subscription) {
        await deletePushSubscription(subscription.endpoint, currentTeacher.id);
        await subscription.unsubscribe();
      }

      setState('available');
    } catch (disableError) {
      setError(
        getFriendlyErrorMessage(disableError, "Les notifications n’ont pas pu être désactivées."),
      );
      setState('error');
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setDismissed(true);
  }

  const canShowFloatingPrompt = displayState === 'available' && !dismissed;

  return (
    <>
      {canShowFloatingPrompt ? (
        <section className="pwa-prompt notification-prompt" aria-label="Notifications du dojo">
          <img src="/icons/dojo-icon-32.png" alt="" width="36" height="36" />
          <div className="pwa-prompt__content">
            <strong>Activer les notifications</strong>
            <span>Nouveaux messages et modifications du planning.</span>
            <button className="text-button" type="button" onClick={() => void handleEnable()}>
              Activer
            </button>
          </div>
          <button
            className="pwa-prompt__close"
            type="button"
            aria-label="Masquer la proposition de notifications"
            title="Masquer"
            onClick={handleDismiss}
          >
            ×
          </button>
        </section>
      ) : null}

      <details className="notification-settings">
        <summary>Notifications du téléphone</summary>
        {displayState === 'active' ? <p>Les notifications du dojo sont activées sur cet appareil.</p> : null}
        {displayState === 'needs-install' ? (
          <p>Installez d’abord l’application sur l’écran d’accueil, puis ouvrez-la depuis son icône.</p>
        ) : null}
        {displayState === 'denied' ? (
          <p>Les notifications sont bloquées. Autorisez-les dans les réglages du navigateur ou du téléphone.</p>
        ) : null}
        {displayState === 'unsupported' ? (
          <p>Ce navigateur ne prend pas en charge les notifications Web Push.</p>
        ) : null}
        {displayState === 'unconfigured' ? (
          <p>
            {import.meta.env.DEV
              ? 'Configuration manquante : renseignez VITE_WEB_PUSH_PUBLIC_KEY.'
              : "Les notifications ne sont pas encore configurées. Contactez l'administrateur."}
          </p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}

        {(displayState === 'available' || displayState === 'error') && installed && publicKey ? (
          <button className="text-button" type="button" onClick={() => void handleEnable()}>
            Activer les notifications
          </button>
        ) : null}
        {displayState === 'active' ? (
          <button className="text-button" type="button" onClick={() => void handleDisable()}>
            Désactiver sur cet appareil
          </button>
        ) : null}
        {displayState === 'activating' ? <p>Activation en cours…</p> : null}
        {displayState === 'disabling' ? <p>Désactivation en cours…</p> : null}
      </details>
    </>
  );
}
