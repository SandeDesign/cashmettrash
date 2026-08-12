// src/pages/klant/BetalingGelukt.tsx
//
// Handelt twee soorten betalingen af: een glas-ophaalbeurt en de ophaalkosten
// voor statiegeld. Welke van de twee staat in de querystring.

import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { retrieveSession } from '../../utils/stripe';
import { stuurPushNaarRol } from '../../utils/push';

type Resultaat = 'bezig' | 'gelukt' | 'openstaand' | 'fout';

const BetalingGelukt: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const sessionId = params.get('session_id');
  const soort = params.get('soort') === 'service' ? 'service' : 'glas';

  const markeerBetaald = useGlasStore((s) => s.markeerBetaald);
  const markeerServicekostenBetaald = useStatiegeldStore((s) => s.markeerServicekostenBetaald);

  const [resultaat, setResultaat] = useState<Resultaat>('bezig');
  const [melding, setMelding] = useState('');
  const afgehandeld = useRef(false);

  useEffect(() => {
    if (afgehandeld.current) return;
    afgehandeld.current = true;

    if (!orderId || !sessionId) {
      setResultaat('fout');
      setMelding('We konden deze betaling niet terugvinden.');
      return;
    }

    (async () => {
      const sessie = await retrieveSession(sessionId);

      if (sessie.error) {
        setResultaat('fout');
        setMelding(sessie.error);
        return;
      }

      if (sessie.payment_status === 'paid') {
        try {
          if (soort === 'service') {
            await markeerServicekostenBetaald(orderId, sessionId, sessie.payment_status);
            void stuurPushNaarRol('admin', {
              titel: 'Ophaalkosten betaald',
              tekst: 'Een klant heeft de ophaalkosten voor statiegeld voldaan.',
              url: '/admin/statiegeld',
            });
          } else {
            await markeerBetaald(orderId, sessionId, sessie.payment_status);
            // Jayce hoort meteen dat er glas klaarstaat; bedragen krijgt hij niet.
            void stuurPushNaarRol('jayce', {
              titel: 'Nieuwe ophaaltaak',
              tekst: 'Er staat glas voor je klaar.',
              url: '/jayce',
            });
            void stuurPushNaarRol('admin', {
              titel: 'Glas betaald',
              tekst: 'Een klant heeft een ophaalbeurt glas betaald.',
              url: '/admin',
            });
          }
          setResultaat('gelukt');
        } catch {
          // Bij Stripe is de betaling wel gelukt, alleen het bijwerken faalde.
          setResultaat('gelukt');
          setMelding('Je betaling is gelukt. Het overzicht is mogelijk pas later bijgewerkt.');
        }
        return;
      }

      setResultaat('openstaand');
      setMelding('De betaling wordt nog verwerkt. Je ziet de status straks in je overzicht.');
    })();
  }, [orderId, sessionId, soort, markeerBetaald, markeerServicekostenBetaald]);

  const standaardTekst =
    soort === 'service'
      ? 'De ophaalkosten zijn voldaan. Je Tikkie van Viatim staat klaar in je berichten.'
      : 'Je aanvraag staat klaar. Jayce komt binnenkort je glas ophalen.';

  return (
    <AppLayout nav={KLANT_NAV}>
      <div className={`${soort === 'service' ? 'cmt-flow-stat' : 'cmt-flow-glas'} max-w-md mx-auto`}>
        <div className="cmt-card text-center cmt-animate-in">
          {resultaat === 'bezig' && <Loading text="Betaling controleren..." />}

          {resultaat === 'gelukt' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--cmt-accent)' }} />
              <h1 className="text-xl font-bold mb-2">Gelukt, bedankt!</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--cmt-ink-soft)' }}>
                {melding || standaardTekst}
              </p>
            </>
          )}

          {(resultaat === 'openstaand' || resultaat === 'fout') && (
            <>
              <AlertCircle
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: resultaat === 'fout' ? 'var(--cmt-error)' : 'var(--cmt-warning)' }}
              />
              <h1 className="text-xl font-bold mb-2">
                {resultaat === 'fout' ? 'Er ging iets mis' : 'Nog even geduld'}
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--cmt-ink-soft)' }}>
                {melding}
              </p>
            </>
          )}

          {resultaat !== 'bezig' && (
            <Link to={soort === 'service' ? '/chat' : '/mijn'} className="cmt-btn-primary">
              {soort === 'service' ? 'Naar mijn berichten' : 'Naar mijn overzicht'}
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BetalingGelukt;
