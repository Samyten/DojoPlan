import { useEffect, useState } from 'react';
import { isInstalledApp, isIosDevice } from '../../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_AT_KEY = 'dojo-planning.install-prompt-dismissed-at.v1';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

function isMobileBrowser() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY));
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION;
}

export function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | undefined>();
  const [installed, setInstalled] = useState(isInstalledApp);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const iosBrowser = isIosDevice();
  const mobileBrowser = isMobileBrowser();

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(undefined);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (installed || (!installPrompt && !iosBrowser && !mobileBrowser)) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) {
      setShowIosInstructions((current) => !current);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }

    setInstallPrompt(undefined);
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setDismissed(true);
  }

  return (
    <section
      className="pwa-prompt install-app-prompt"
      aria-label="Installation de l’application"
      hidden={dismissed}
    >
      <img src="/icons/dojo-icon-32.png" alt="" width="36" height="36" />
      <div className="pwa-prompt__content">
        <strong>Installer l’application</strong>
        <span>Accès rapide depuis l’écran d’accueil.</span>
        <button className="text-button" type="button" onClick={() => void handleInstall()}>
          {installPrompt ? 'Installer' : 'Voir comment'}
        </button>
      </div>
      <button
        className="pwa-prompt__close"
        type="button"
        aria-label="Masquer la proposition d’installation"
        title="Masquer"
        onClick={handleDismiss}
      >
        ×
      </button>
      {showIosInstructions ? (
        <p>
          {iosBrowser
            ? 'Dans le menu Partager, choisissez « Sur l’écran d’accueil ».'
            : 'Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'}
        </p>
      ) : null}
    </section>
  );
}
