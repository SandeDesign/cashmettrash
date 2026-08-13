// src/pages/klant/StatiegeldMelden.tsx
//
// Statiegeld-flow: aanmelden is gratis en kost hier geen betaling. Het statiegeld
// zelf komt onaangeroerd uit Viatim en gaat volledig naar de klant. De
// ophaalkosten worden pas achteraf in rekening gebracht, samen met de Tikkie.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Heart, Recycle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import AantalVeld from '../../components/common/AantalVeld';
import BuitenWerkgebied from '../../components/klant/BuitenWerkgebied';
import VoorkeurKiezer, { type Voorkeur } from '../../components/klant/VoorkeurKiezer';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useWerkgebiedToets } from '../../hooks/useWerkgebiedToets';
import { formatCenten, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';

const StatiegeldMelden: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customer, loading, loadCustomer } = useCustomerStore();
  const maakMelding = useStatiegeldStore((s) => s.maakMelding);
  const { bezig: toetsBezig, oordeel } = useWerkgebiedToets(customer);

  const [plastic, setPlastic] = useState(0);
  const [blik, setBlik] = useState(0);
  const [opmerking, setOpmerking] = useState('');
  const [schenken, setSchenken] = useState(false);
  const [voorkeur, setVoorkeur] = useState<Voorkeur | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (user) loadCustomer(user.uid);
  }, [user, loadCustomer]);

  const isBekende = !!customer?.isBekende;
  const mag = !oordeel || oordeel.mag;

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
      await maakMelding(
        customer,
        { plastic, blik },
        opmerking.trim() || undefined,
        isBekende && schenken,
        voorkeur
      );
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

        {(loading && !customer) || toetsBezig ? (
          <Loading />
        ) : !customer ? (
          <div className="cmt-alert cmt-alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>We konden je gegevens niet laden. Probeer het later opnieuw.</span>
          </div>
        ) : !mag ? (
          <BuitenWerkgebied
            postcode={customer.postcode}
            plaats={customer.plaats}
            afstand={oordeel && !oordeel.mag ? oordeel.afstandMeters : undefined}
          />
        ) : (
          <form onSubmit={verstuur} className="cmt-card cmt-animate-in">
            <Recycle className="w-8 h-8 mb-3" style={{ color: 'var(--cmt-stat)' }} />
            <h1 className="text-xl font-bold mb-1">Statiegeld aanmelden</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Voor <strong>plastic</strong> flessen en blikjes mét statiegeldlogo. Geef ongeveer
              aan wat er klaarstaat; precies hoeven de aantallen niet te zijn, want Jayce telt bij
              het ophalen na.
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

            <VoorkeurKiezer waarde={voorkeur} onKies={setVoorkeur} />

            {isBekende && (
              <label className="cmt-card cmt-card-tint !p-4 mb-5 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 flex-shrink-0"
                  checked={schenken}
                  onChange={(e) => setSchenken(e.target.checked)}
                />
                <span>
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Heart className="w-4 h-4" style={{ color: 'var(--cmt-stat)' }} />
                    Ik schenk dit statiegeld aan Jayce
                  </span>
                  <span
                    className="block text-xs mt-1"
                    style={{ color: 'var(--cmt-ink-soft)' }}
                  >
                    Je krijgt dan geen Tikkie terug, en je betaalt ook geen ophaalkosten.
                  </span>
                </span>
              </label>
            )}

            <button type="submit" className="cmt-btn-primary cmt-btn-block cmt-btn-lg" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Aanmelden'}
            </button>

            <p className="mt-3 text-center text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              {schenken ? (
                <>
                  Aanmelden is gratis. Wat het statiegeld oplevert gaat naar het potje van Jayce,
                  en ophaalkosten rekenen we niet.
                </>
              ) : (
                <>
                  Aanmelden is gratis. Zodra het is ingeleverd krijg je het volledige statiegeld
                  terug via een Tikkie, en betaal je {formatCenten(STATIEGELD_SERVICE_CENTEN)}{' '}
                  ophaalkosten.
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default StatiegeldMelden;
