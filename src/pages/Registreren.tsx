// src/pages/Registreren.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { useAuthStore } from '../store/authStore';
import {
  validateDutchPhone,
  validateDutchPostcode,
  validateEmail,
  validatePassword,
} from '../utils/validation';

const LEEG = {
  naam: '',
  email: '',
  wachtwoord: '',
  telefoon: '',
  adres: '',
  postcode: '',
  plaats: '',
};

const Registreren: React.FC = () => {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [velden, setVelden] = useState(LEEG);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const zet = (sleutel: keyof typeof LEEG) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVelden((v) => ({ ...v, [sleutel]: e.target.value }));

  const controleer = (): string | null => {
    if (!velden.naam.trim()) return 'Vul je naam in';
    if (!validateEmail(velden.email)) return 'Vul een geldig e-mailadres in';
    if (!validatePassword(velden.wachtwoord)) return 'Kies een wachtwoord van minstens 8 tekens';
    if (!validateDutchPhone(velden.telefoon)) return 'Vul een geldig telefoonnummer in';
    if (!velden.adres.trim()) return 'Vul je straat en huisnummer in';
    if (!validateDutchPostcode(velden.postcode)) return 'Vul een geldige postcode in (bijv. 6161 AB)';
    if (!velden.plaats.trim()) return 'Vul je woonplaats in';
    return null;
  };

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const probleem = controleer();
    if (probleem) {
      setFout(probleem);
      return;
    }

    setFout(null);
    setBezig(true);

    try {
      await register({
        naam: velden.naam.trim(),
        email: velden.email.trim(),
        wachtwoord: velden.wachtwoord,
        telefoon: velden.telefoon.trim(),
        adres: velden.adres.trim(),
        postcode: velden.postcode,
        plaats: velden.plaats.trim(),
      });
      navigate('/mijn', { replace: true });
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Registreren mislukt');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Logo size="lg" className="mb-6" />

      <form onSubmit={verstuur} className="cmt-card w-full max-w-md cmt-animate-in">
        <h1 className="text-xl font-bold mb-1">Aanmelden</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-muted)' }}>
          Je adres hebben we nodig zodat Jayce weet waar hij langs moet komen.
        </p>

        {fout && (
          <div className="cmt-alert cmt-alert-error mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{fout}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="cmt-label" htmlFor="naam">
            Naam
          </label>
          <input id="naam" className="cmt-input" value={velden.naam} onChange={zet('naam')} autoComplete="name" required />
        </div>

        <div className="mb-4">
          <label className="cmt-label" htmlFor="email">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            className="cmt-input"
            value={velden.email}
            onChange={zet('email')}
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-4">
          <label className="cmt-label" htmlFor="wachtwoord">
            Wachtwoord
          </label>
          <input
            id="wachtwoord"
            type="password"
            className="cmt-input"
            value={velden.wachtwoord}
            onChange={zet('wachtwoord')}
            autoComplete="new-password"
            required
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
            Minstens 8 tekens
          </p>
        </div>

        <div className="mb-4">
          <label className="cmt-label" htmlFor="telefoon">
            Telefoonnummer
          </label>
          <input
            id="telefoon"
            type="tel"
            className="cmt-input"
            value={velden.telefoon}
            onChange={zet('telefoon')}
            autoComplete="tel"
            placeholder="06 12345678"
            required
          />
        </div>

        <div className="mb-4">
          <label className="cmt-label" htmlFor="adres">
            Straat en huisnummer
          </label>
          <input
            id="adres"
            className="cmt-input"
            value={velden.adres}
            onChange={zet('adres')}
            autoComplete="street-address"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="cmt-label" htmlFor="postcode">
              Postcode
            </label>
            <input
              id="postcode"
              className="cmt-input"
              value={velden.postcode}
              onChange={zet('postcode')}
              autoComplete="postal-code"
              placeholder="6161 AB"
              required
            />
          </div>
          <div>
            <label className="cmt-label" htmlFor="plaats">
              Plaats
            </label>
            <input
              id="plaats"
              className="cmt-input"
              value={velden.plaats}
              onChange={zet('plaats')}
              autoComplete="address-level2"
              required
            />
          </div>
        </div>

        <button type="submit" className="cmt-btn-primary cmt-btn-block" disabled={bezig}>
          {bezig ? 'Bezig...' : 'Account aanmaken'}
        </button>

        <p className="mt-3 text-center text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
          Door een account aan te maken ga je akkoord met onze{' '}
          <Link to="/voorwaarden" style={{ color: 'var(--cmt-glas-dark)' }}>
            algemene voorwaarden
          </Link>{' '}
          en de{' '}
          <Link to="/privacy" style={{ color: 'var(--cmt-glas-dark)' }}>
            privacyverklaring
          </Link>
          .
        </p>

        <p className="mt-5 text-center text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          Heb je al een account?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'var(--cmt-glas)' }}>
            Inloggen
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Registreren;
