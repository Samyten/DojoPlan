import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './auth/AuthProvider';
import { AppErrorBoundary } from './components/ui/AppErrorBoundary';
import './styles/global.css';

if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  navigator.serviceWorker.controller
) {
  let isReloadingForUpdate = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isReloadingForUpdate) {
      return;
    }

    isReloadingForUpdate = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
