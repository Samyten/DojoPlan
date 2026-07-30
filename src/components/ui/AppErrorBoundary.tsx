import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("L'application a rencontré une erreur inattendue.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell app-shell--loading">
          <section className="panel recovery-panel">
            <p className="eyebrow">Erreur inattendue</p>
            <h1>L'application doit être rechargée</h1>
            <p>Aucune nouvelle modification ne sera envoyée avant le rechargement.</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Recharger l'application
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
