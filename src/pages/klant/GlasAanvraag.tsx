// src/pages/klant/GlasAanvraag.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import BuitenWerkgebied from '../../components/klant/BuitenWerkgebied';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore } from '../../store/customerStore';
import { useGlasStore } from '../../store/glasStore';
import { useInstellingenStore, postcodeInGebied } from '../../store/instellingenStore';
import { createCheckoutSession } from '../../utils/stripe';
import { formatCenten, GLAS_PRIJS_CENTEN } from '../../utils/constants';

const GlasAanvraag: React.FC = () => {
  const { user } = useAuth();
  const { customer, loading, loadCustomer } = useCustomerStore();
  const maakOrder = useGlasStore((s) => s.maakOrder);
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  const [opmerking, setOpmerking] = useState('');
  const [akkoordDirect, setAkkoordDirect] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (user) loadCustomer(user.uid);
    loadWerkgebied();
  }, [user, loadCustomer, loadWerkgebied]);

  // Buiten het werkgebied kan alleen een bekende nog aanvragen.
  const mag =
    !customer || !!customer.isBekende || postcodeInGebied(customer.postcode, werkgebied);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !user) return;

    if (!akkoordDirect) {
      setFout('Zet een vinkje bij de laatste regel om verder te kunnen.');
      return;
    }

    setFout(null);
    setBezig(true);

    try {
      const orderId = await maakOrder(customer, opmerking.trim() || undefined);
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

        {loading && !customer ? (
          <Loading />
        ) : !customer ? (
          <div className="cmt-alert cmt-alert-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>We konden je gegevens niet laden. Probeer het later opnieuw.</span>
          </div>
        ) : !mag ? (
          <BuitenWerkgebied postcode={customer.postcode} plaats={customer.plaats} />
        ) : (
          <form onSubmit={verstuur} className="cmt-card cmt-animate-in">
            <Wine className="w-8 h-8 mb-3" style={{ color: 'var(--cmt-glas)' }} />
            <h1 className="text-xl font-bold mb-1">Glas laten ophalen</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Zet je glazen flessen klaar. Jayce komt binnenkort langs.
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
                placeholder="Bijv. de kratten staan naast de voordeur"
                maxLength={280}
              />
            </div>

            <div
              className="flex items-baseline justify-between mb-5 pt-4"
              style={{ borderTop: '1px solid var(--cmt-border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                Ophaalbeurt
              </span>
              <span className="text-xl font-bold">{formatCenten(GLAS_PRIJS_CENTEN)}</span>
            </div>

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
              disabled={bezig || !akkoordDirect}
            >
              {bezig ? 'Bezig...' : 'Naar betalen'}
            </button>

            <p className="mt-3 text-center text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              Je betaalt eenmalig per ophaalbeurt, niet per fles.
            </p>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default GlasAanvraag;
