// src/pages/klant/BetalingGelukt.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { retrieveSession } from '../../utils/stripe';

type Resultaat = 'bezig' | 'gelukt' | 'openstaand' | 'fout';

const BetalingGelukt: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const sessionId = params.get('session_id');
  const markeerBetaald = useGlasStore((s) => s.markeerBetaald);

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
          await markeerBetaald(orderId, sessionId, sessie.payment_status);
          setResultaat('gelukt');
        } catch {
          // De betaling is bij Stripe wél gelukt; alleen het bijwerken faalde.
          setResultaat('gelukt');
          setMelding('Je betaling is gelukt. Het overzicht is mogelijk pas later bijgewerkt.');
        }
        return;
      }

      setResultaat('openstaand');
      setMelding('De betaling wordt nog verwerkt. Je ziet de status straks in je overzicht.');
    })();
  }, [orderId, sessionId, markeerBetaald]);

  return (
    <AppLayout nav={KLANT_NAV}>
      <div className="cmt-flow-glas max-w-md mx-auto">
        <div className="cmt-card text-center cmt-animate-in">
          {resultaat === 'bezig' && <Loading text="Betaling controleren..." />}

          {resultaat === 'gelukt' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--cmt-glas)' }} />
              <h1 className="text-xl font-bold mb-2">Gelukt, bedankt!</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--cmt-ink-soft)' }}>
                {melding || 'Je aanvraag staat klaar. Jayce komt binnenkort je glas ophalen.'}
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
            <Link to="/mijn" className="cmt-btn-primary">
              Naar mijn overzicht
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BetalingGelukt;
