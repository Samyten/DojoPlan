import { useState } from 'react';
import { useAuth } from './useAuth';
import { getFriendlyErrorMessage } from '../utils/errors';

export function LoginScreen() {
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  return (
    <main className="auth-screen">
      <section className="panel auth-panel" aria-labelledby="login-heading">
        <p className="eyebrow">Connexion</p>
        <h1 id="login-heading">Planning du dojo</h1>
        <p>Connectez-vous avec votre compte professeur.</p>

        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!email.trim() || !password) {
              setFormError("L'email et le mot de passe sont obligatoires.");
              return;
            }

            setIsSubmitting(true);
            setFormError(undefined);

            try {
              await signIn({ email, password });
            } catch (signInError) {
              setFormError(
                getFriendlyErrorMessage(signInError, 'La connexion a échoué.'),
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {formError || error ? <p className="form-error">{formError ?? error}</p> : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="professeur@dojo.fr"
            />
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
            />
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  );
}
