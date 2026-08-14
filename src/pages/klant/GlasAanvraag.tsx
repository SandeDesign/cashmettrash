// src/pages/klant/GlasAanvraag.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Coins, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import BuitenWerkgebied from '../../components/klant/BuitenWerkgebied';
import VoorkeurKiezer, { type Voorkeur } from '../../components/klant/VoorkeurKiezer';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useGlasStore } from '../../store/glasStore';
import { useWerkgebiedToets } from '../../hooks/useWerkgebiedToets';
import { createCheckoutSession } from '../../utils/stripe';
import { formatCenten, GLAS_PRIJS_CENTEN } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';

const GlasAanvraag: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { customer, loading, loadCustomer } = useCustomerStore();
  const maakOrder = useGlasStore((s) => s.maakOrder);
  const { bezig: toetsBezig, oordeel } = useWerkgebiedToets(customer);

  const [opmerking, setOpmerking] = useState('');
  const [contant, setContant] = useState(false);
  const [akkoordDirect, setAkkoordDirect] = useState(false);
  const [voorkeur, setVoorkeur] = useState<Voorkeur | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (user) loadCustomer(user.uid);
  }, [user, loadCustomer]);

  // Buiten het werkgebied kan alleen een bekende nog aanvragen.
  const mag = !oordeel || oordeel.mag;

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !user) return;

    if (!voorkeur) {
      setFout('Kies wanneer je thuis kunt zijn.');
      return;
    }

    if (!akkoordDirect) {
      setFout('Zet een vinkje bij de laatste regel om verder te kunnen.');
      return;
    }

    setFout(null);
    setBezig(true);

    try {
      const orderId = await maakOrder(customer, opmerking.trim() || undefined, voorkeur, contant);

      // Contant betalen loopt niet langs Stripe: de aanvraag staat meteen op de
      // lijst van Jayce en het geld krijgt hij aan de deur.
      if (contant) {
        void stuurPushNaarRol('jayce', {
          titel: 'Nieuwe ophaaltaak',
          tekst: `Er staat glas klaar bij ${customer.naam}.`,
          url: '/jayce',
        });
        void stuurPushNaarRol('admin', {
          titel: 'Glas aangemeld',
          tekst: `${customer.naam} betaalt de ophaalbeurt contant.`,
          url: '/admin',
        });
        navigate('/mijn', { replace: true });
        return;
      }

      const origin = window.location.origin;

      const sessie = await createCheckoutSession({
        bedragCenten: GLAS_PRIJS_CENTEN,
        productNaam: 'Ophaalbeurt glas',
        klantEmail: customer.email,
        orderId,
        successUrl: `${origin}/betaling/gelukt?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/betaling/geannuleerd?order=${orderId}`,
      });

      if (sessie.error || !sessie.url) {
        throw new Error(sessie.error || 'Betaling kon niet worden gestart');
      }

      window.location.href = sessie.url;
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Er ging iets mis');
      setBezig(false);
    }
  };

  return (
    <AppLayout nav={KLANT_NAV}>
      <div className="cmt-flow-glas max-w-md mx-auto">
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
            <Wine className="w-8 h-8 mb-3" style={{ color: 'var(--cmt-glas)' }} />
            <h1 className="text-xl font-bold mb-1">Glas laten ophalen</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Voor glas <strong>zonder</strong> statiegeldlogo: wijnflessen, jampotten,
              sauspotten. Zit er wél een logo op, meld het dan aan als statiegeld, dan krijg je
              er geld voor terug.
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
              <p className="mt-2 text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                Klopt dit niet? Pas het aan in je profiel.
              </p>
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
                placeholder="Bijv. bel bij het bovenste belletje"
                maxLength={280}
              />
            </div>

            <VoorkeurKiezer waarde={voorkeur} onKies={setVoorkeur} />

            <div
              className="flex items-baseline justify-between mb-5 pt-4"
              style={{ borderTop: '1px solid var(--cmt-border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                Ophaalbeurt
              </span>
              <span className="text-xl font-bold">{formatCenten(GLAS_PRIJS_CENTEN)}</span>
            </div>

            <fieldset className="mb-5">
              <legend className="cmt-label">Hoe wil je betalen?</legend>

              <label className="cmt-card cmt-card-tint !p-4 mb-2 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="betaalwijze"
                  className="mt-1 flex-shrink-0"
                  checked={!contant}
                  onChange={() => setContant(false)}
                />
                <span>
                  <span className="font-semibold text-sm">Nu in de app</span>
                  <span className="block text-xs mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
                    Je rekent meteen af. Daarna komt je aanvraag bij Jayce op de lijst.
                  </span>
                </span>
              </label>

              <label className="cmt-card cmt-card-tint !p-4 flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="betaalwijze"
                  className="mt-1 flex-shrink-0"
                  checked={contant}
                  onChange={() => setContant(true)}
                />
                <span>
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Coins className="w-4 h-4" style={{ color: 'var(--cmt-glas)' }} />
                    Contant meegeven aan Jayce
                  </span>
                  <span className="block text-xs mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
                    Leg {formatCenten(GLAS_PRIJS_CENTEN)} klaar en geef het mee als hij langskomt.
                    Je aanvraag staat meteen op zijn lijst. De moeder van Jayce bevestigt thuis dat
                    hij het geld heeft.
                  </span>
                </span>
              </label>
            </fieldset>

            {/* Zonder deze instemming blijft de wettelijke bedenktijd van veertien
                dagen staan en kan de ophaalbeurt niet meteen worden ingepland. */}
            <label className="flex items-start gap-2.5 mb-5 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 flex-shrink-0"
                checked={akkoordDirect}
                onChange={(e) => setAkkoordDirect(e.target.checked)}
              />
              <span style={{ color: 'var(--cmt-ink-soft)' }}>
                Ja, plan de ophaalbeurt meteen in. Ik begrijp dat mijn{' '}
                <Link to="/herroeping" target="_blank" style={{ color: 'var(--cmt-glas-dark)' }}>
                  herroepingsrecht
                </Link>{' '}
                vervalt zodra het glas is opgehaald.
              </span>
            </label>

            <button
              type="submit"
              className="cmt-btn-primary cmt-btn-block cmt-btn-lg"
              disabled={bezig || !akkoordDirect || !voorkeur}
            >
              {bezig ? 'Bezig...' : contant ? 'Aanvragen' : 'Naar betalen'}
            </button>

            <p className="mt-3 text-center text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              Je betaalt eenmalig per ophaalbeurt, niet per fles.
              {contant && ' Leg het geld klaar voordat Jayce komt.'}
            </p>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default GlasAanvraag;
