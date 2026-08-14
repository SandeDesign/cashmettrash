// src/components/admin/AfrekenSheet.tsx
//
// Eén rustig scherm om een statiegeld-melding af te ronden, in plaats van losse
// knoppen naast elkaar in een rij. Je ziet wat Jayce heeft geteld, vult het
// bedrag en de link uit Viatim in, en met één bevestiging is alles klaar:
// verwerkt bij Viatim, Tikkie geregistreerd, ophaalkosten opengezet en het
// bericht naar de klant verstuurd.

import React, { useEffect, useState } from 'react';
import { AlertCircle, Coins, ExternalLink, Heart, Recycle, ScanLine, X } from 'lucide-react';
import { centenAlsInvoer, formatCenten, naarCenten } from '../../utils/constants';
import { isLink, normaliseerLink } from '../../utils/links';
import type { StatiegeldLog } from '../../types';

interface AfrekenSheetProps {
  log: StatiegeldLog;
  onSluiten: () => void;
  onAfrekenen: (tikkieBedrag: number, tikkieLink: string) => Promise<void>;
}

const AfrekenSheet: React.FC<AfrekenSheetProps> = ({ log, onSluiten, onAfrekenen }) => {
  // Heeft mama al ingescand, dan staan het bedrag en de link er al in en hoef je
  // ze alleen nog na te kijken.
  const [euro, setEuro] = useState(log.tikkieBedrag != null ? centenAlsInvoer(log.tikkieBedrag) : '');
  const [link, setLink] = useState(log.tikkieLink ?? '');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bezig) onSluiten();
    };
    window.addEventListener('keydown', opToets);
    return () => window.removeEventListener('keydown', opToets);
  }, [onSluiten, bezig]);

  const geteld = log.itemsWerkelijk ?? log.items;
  const centen = naarCenten(euro);
  // Bij een schenking gaat het bedrag naar het potje van Jayce, dus er is geen
  // Tikkie naar de klant en er zijn geen ophaalkosten.
  const schenking = !!log.geschonken;
  const linkGeldig = schenking || isLink(link);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();

    if (centen === null) {
      setFout('Vul het bedrag in zoals het in Viatim staat, bijvoorbeeld 2,85.');
      return;
    }
    if (!linkGeldig) {
      setFout('Dat lijkt geen webadres. Plak de link uit Viatim, bijvoorbeeld tikkie.me/pay/iets.');
      return;
    }

    setFout(null);
    setBezig(true);
    try {
      await onAfrekenen(centen, schenking ? '' : (normaliseerLink(link) ?? ''));
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Afrekenen mislukt');
      setBezig(false);
    }
  };

  return (
    <div className="cmt-modal-backdrop" onClick={() => !bezig && onSluiten()} role="dialog" aria-modal="true">
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={verstuur}
        className="cmt-modal cmt-flow-stat cmt-animate-in"
        style={{ maxWidth: '32rem' }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-lg font-bold">Afrekenen met {log.customerNaam}</h2>
          <button
            type="button"
            onClick={onSluiten}
            className="opacity-40 hover:opacity-100 transition-opacity"
            aria-label="Sluiten"
            disabled={bezig}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
          {schenking
            ? 'Vul in wat er uit Viatim kwam. Dit bedrag gaat naar het potje van Jayce, dus er wordt geen Tikkie gestuurd.'
            : 'Vul in wat er uit Viatim kwam. De klant krijgt het bericht meteen in de chat.'}
        </p>

        {schenking && (
          <div className="cmt-alert cmt-alert-info mb-4">
            <Heart className="w-5 h-5 flex-shrink-0" />
            <span>{log.customerNaam} schenkt dit statiegeld aan Jayce.</span>
          </div>
        )}

        {log.tikkieKlaargezetDoor && (
          <div className="cmt-alert cmt-alert-info mb-4">
            <ScanLine className="w-5 h-5 flex-shrink-0" />
            <span>
              Mama heeft dit al ingescand en het bedrag en de link ingevuld. Kijk het na en druk op
              versturen.
            </span>
          </div>
        )}

        {log.servicekostenContant && (
          <div
            className={`cmt-alert mb-4 ${log.contantBevestigdOp ? 'cmt-alert-success' : 'cmt-alert-warning'}`}
          >
            <Coins className="w-5 h-5 flex-shrink-0" />
            <span>
              {log.contantBevestigdOp
                ? `De ophaalkosten zijn contant betaald en door mama afgevinkt. De klant hoeft niets meer te doen.`
                : `De klant geeft de ophaalkosten contant mee. Mama moet nog afvinken dat Jayce het geld heeft; tot die tijd blijft de Tikkie op slot.`}
            </span>
          </div>
        )}

        {fout && (
          <div className="cmt-alert cmt-alert-error mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{fout}</span>
          </div>
        )}

        <div className="cmt-card cmt-card-tint !p-4 mb-5">
          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--cmt-stat)' }}>
            <Recycle className="w-4 h-4" />
            <span className="text-sm font-semibold">Geteld door Jayce</span>
          </div>
          <p className="text-lg font-bold">
            {geteld.plastic} flessen · {geteld.blik} blikjes
          </p>
          {log.itemsWerkelijk && (
            <p className="text-xs mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
              De klant schatte {log.items.plastic} flessen en {log.items.blik} blikjes
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="cmt-label" htmlFor="afreken-bedrag">
            Bedrag uit Viatim
          </label>
          <input
            id="afreken-bedrag"
            className="cmt-input"
            inputMode="decimal"
            placeholder="2,85"
            value={euro}
            onChange={(e) => setEuro(e.target.value)}
            autoFocus
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
            {schenking
              ? 'Dit bedrag gaat naar het potje van Jayce.'
              : 'Dit bedrag gaat volledig naar de klant.'}
          </p>
        </div>

        {!schenking && (
          <div className="mb-5">
            <label className="cmt-label" htmlFor="afreken-link">
              Tikkie-link uit Viatim
            </label>
            <input
              id="afreken-link"
              className="cmt-input"
              inputMode="url"
              placeholder="https://tikkie.me/pay/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        )}

        <div
          className="flex items-baseline justify-between pt-4 mb-5"
          style={{ borderTop: '1px solid var(--cmt-border)' }}
        >
          <span className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
            Ophaalkosten die de klant betaalt
          </span>
          <span className="font-bold">
            {schenking
              ? 'geen'
              : log.contantBevestigdOp
                ? `${formatCenten(log.servicekosten)} contant voldaan`
                : formatCenten(log.servicekosten)}
          </span>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className="cmt-btn-ghost" onClick={onSluiten} disabled={bezig}>
            Annuleren
          </button>
          <button
            type="submit"
            className="cmt-btn-primary"
            disabled={bezig || centen === null || !linkGeldig}
          >
            <ExternalLink className="w-4 h-4" />
            {bezig ? 'Bezig...' : schenking ? 'Afronden' : 'Afronden en versturen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AfrekenSheet;
