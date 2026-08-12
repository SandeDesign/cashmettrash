// src/pages/klant/StatiegeldMelden.tsx
//
// Statiegeld-flow: aanmelden is gratis en kost hier geen betaling. Het statiegeld
// zelf komt onaangeroerd uit Viatim en gaat volledig naar de klant. De
// ophaalkosten worden pas achteraf in rekening gebracht, samen met de Tikkie.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Recycle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';

const AantalVeld: React.FC<{
  id: string;
  label: string;
  waarde: number;
  onChange: (n: number) => void;
}> = ({ id, label, waarde, onChange }) => (
  <div>
    <label className="cmt-label" htmlFor={id}>
      {label}
    </label>
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={0}
      max={999}
      className="cmt-input"
      value={waarde}
      onChange={(e) => onChange(Math.max(0, Math.min(999, Number(e.target.value) || 0)))}
    />
  </div>
);

const StatiegeldMelden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customer, loading, loadCustomer } = useCustomerStore();
  const maakMelding = useStatiegeldStore((s) => s.maakMelding);

  const [plastic, setPlastic] = useState(0);
  const [blik, setBlik] = useState(0);
  const [opmerking, setOpmerking] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (user) loadCustomer(user.uid);
  }, [user, loadCustomer]);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (plastic === 0 && blik === 0) {
      setFout('Vul in hoeveel flessen of blikjes je hebt staan.');
      return;
    }

    setFout(null);
    setBezig(true);

    try {
      await maakMelding(customer, { plastic, blik }, opmerking.trim() || undefined);
      void stuurPushNaarRol('jayce', {
        titel: 'Nieuwe ophaaltaak',
        tekst: `Er staat statiegeld klaar bij ${customer.naam}.`,
        url: '/jayce',
      });
      void stuurPushNaarRol('admin', {
        titel: 'Statiegeld aangemeld',
        tekst: `${customer.naam} heeft statiegeld aangemeld.`,
        url: '/admin',
      });
      navigate('/mijn', { replace: true });
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Aanmelden mislukt');
      setBezig(false);
    }
  };

  return (
    <AppLayout nav={KLANT_NAV}>
      <div className="cmt-flow-stat max-w-md mx-auto">
        <Link
          to="/mijn"
          className="inline-flex items-center gap-1.5 text-sm mb-4"
          style={{ color: 'var(--cmt-ink-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Terug
        </Link>

        {loading && !customer ? (
          <Loading />
        ) : !customer ? (
          <div className="cmt-alert cmt-alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>We konden je gegevens niet laden. Probeer het later opnieuw.</span>
          </div>
        ) : (
          <form onSubmit={verstuur} className="cmt-card cmt-animate-in">
            <Recycle className="w-8 h-8 mb-3" style={{ color: 'var(--cmt-stat)' }} />
            <h1 className="text-xl font-bold mb-1">Statiegeld aanmelden</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Geef ongeveer aan wat er klaarstaat. Precies hoeven de aantallen niet te zijn,
              Jayce telt bij het ophalen.
            </p>

            {fout && (
              <div className="cmt-alert cmt-alert-error mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{fout}</span>
              </div>
            )}

            <div className="cmt-card cmt-card-tint mb-4 !p-4">
              <p className="cmt-label !mb-1">Ophaaladres</p>
              <p className="text-sm font-medium">{customer.adres}</p>
              <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                {customer.postcode} {customer.plaats}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <AantalVeld id="plastic" label="Plastic flessen" waarde={plastic} onChange={setPlastic} />
              <AantalVeld id="blik" label="Blikjes" waarde={blik} onChange={setBlik} />
            </div>

            <div className="mb-5">
              <label className="cmt-label" htmlFor="opmerking">
                Opmerking voor Jayce (optioneel)
              </label>
              <textarea
                id="opmerking"
                className="cmt-textarea"
                value={opmerking}
                onChange={(e) => setOpmerking(e.target.value)}
                placeholder="Bijv. de zakken staan in de schuur"
                maxLength={280}
              />
            </div>

            <button type="submit" className="cmt-btn-primary cmt-btn-block cmt-btn-lg" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Aanmelden'}
            </button>

            <p className="mt-3 text-center text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              Aanmelden is gratis. Zodra het is ingeleverd krijg je het volledige
              statiegeld terug via een Tikkie, en betaal je{' '}
              {formatCenten(STATIEGELD_SERVICE_CENTEN)} ophaalkosten.
            </p>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default StatiegeldMelden;
