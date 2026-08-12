// src/pages/Login.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { useAuthStore } from '../store/authStore';
import { DASHBOARD_PAD } from '../hooks/useAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setFout(null);
    setBezig(true);

    try {
      await login(email.trim(), wachtwoord);
      const rol = useAuthStore.getState().user?.rol;
      navigate(rol ? DASHBOARD_PAD[rol] : '/mijn', { replace: true });
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Inloggen mislukt');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Logo size="lg" className="mb-2" />
      <p className="mb-8 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
        Glas en statiegeld ophalen bij jou in de buurt
      </p>

      <form onSubmit={verstuur} className="cmt-card w-full max-w-sm cmt-animate-in">
        <h1 className="text-xl font-bold mb-5">Inloggen</h1>

        {fout && (
          <div className="cmt-alert cmt-alert-error mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{fout}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="cmt-label" htmlFor="email">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            className="cmt-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-6">
          <label className="cmt-label" htmlFor="wachtwoord">
            Wachtwoord
          </label>
          <input
            id="wachtwoord"
            type="password"
            className="cmt-input"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="cmt-btn-primary cmt-btn-block" disabled={bezig}>
          {bezig ? 'Bezig...' : 'Inloggen'}
        </button>

        <p className="mt-5 text-center text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          Nog geen account?{' '}
          <Link to="/registreren" className="font-semibold" style={{ color: 'var(--cmt-glas)' }}>
            Aanmelden
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
