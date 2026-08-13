// src/components/chat/ChatVenster.tsx
//
// Gedeeld gespreksvenster voor klant en admin. De klantkant krijgt bij een
// Tikkie-bericht extra knoppen mee via de renderExtra-prop.

import React, { useEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ExternalLink, Link2, Send, X } from 'lucide-react';
import Loading from '../shared/Loading';
import BerichtTekst from './BerichtTekst';
import { isLink, normaliseerLink } from '../../utils/links';
import type { ChatBericht } from '../../types';

interface ChatVensterProps {
  berichten: ChatBericht[];
  loading: boolean;
  /** Welke kant 'ik' ben; bepaalt links of rechts uitlijnen. */
  ikBen: 'klant' | 'admin';
  onVerstuur: (tekst: string, tikkieLink?: string) => Promise<void>;
  /** Alleen de beheerder mag een Tikkie-link meesturen. */
  magTikkieSturen?: boolean;
  /**
   * Toont bij een Tikkie-bericht meteen de knop om de link te openen. Aan de
   * klantkant staat dit uit: die krijgt de Tikkie pas te zien nadat de
   * ophaalkosten betaald zijn, en dat regelt de pagina zelf via renderExtra.
   */
  toonTikkieKnop?: boolean;
  /** Extra inhoud onder een bericht, bijvoorbeeld de Tikkie-knoppen. */
  renderExtra?: (bericht: ChatBericht) => React.ReactNode;
  legeTekst?: string;
}

const tijd = (iso: string) => format(new Date(iso), 'HH:mm');
const dag = (iso: string) => format(new Date(iso), 'EEEE d MMMM', { locale: nl });

const ChatVenster: React.FC<ChatVensterProps> = ({
  berichten,
  loading,
  ikBen,
  onVerstuur,
  renderExtra,
  magTikkieSturen = false,
  toonTikkieKnop = true,
  legeTekst = 'Nog geen berichten.',
}) => {
  const [tekst, setTekst] = useState('');
  const [tikkieLink, setTikkieLink] = useState('');
  const [tikkieOpen, setTikkieOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const onderkant = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onderkant.current?.scrollIntoView({ block: 'end' });
  }, [berichten.length]);

  // We slaan het adres genormaliseerd op, zodat "tikkie.me/pay/x" ook werkt.
  const linkSchoon = tikkieLink.trim();
  const linkGeldig = !tikkieOpen || linkSchoon === '' || isLink(linkSchoon);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const schoon = tekst.trim();
    if (!schoon || bezig || !linkGeldig) return;

    setBezig(true);
    try {
      await onVerstuur(schoon, normaliseerLink(linkSchoon) ?? undefined);
      setTekst('');
      setTikkieLink('');
      setTikkieOpen(false);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '60vh' }}>
      <div className="flex-1 space-y-3 mb-4">
        {loading && berichten.length === 0 && <Loading text="Berichten laden..." />}

        {!loading && berichten.length === 0 && (
          <div className="cmt-card cmt-empty-state">{legeTekst}</div>
        )}

        {berichten.map((bericht, i) => {
          const vanMij = bericht.afzender === ikBen;
          const vorige = berichten[i - 1];
          const nieuweDag =
            !vorige || !isSameDay(new Date(vorige.aangemaaktOp), new Date(bericht.aangemaaktOp));

          return (
            <React.Fragment key={bericht.id}>
              {nieuweDag && (
                <p
                  className="text-center text-xs py-2"
                  style={{ color: 'var(--cmt-ink-muted)' }}
                >
                  {dag(bericht.aangemaaktOp)}
                </p>
              )}

              <div className={`flex ${vanMij ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <div
                    className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                    style={{
                      background: vanMij ? 'var(--cmt-glas)' : 'var(--cmt-surface)',
                      color: vanMij ? '#fff' : 'var(--cmt-ink)',
                      border: vanMij ? 'none' : '1px solid var(--cmt-border)',
                      borderRadius: '16px',
                      borderBottomRightRadius: vanMij ? '4px' : '16px',
                      borderBottomLeftRadius: vanMij ? '16px' : '4px',
                      boxShadow: 'var(--cmt-shadow-card)',
                    }}
                  >
                    <BerichtTekst tekst={bericht.tekst} />
                  </div>

                  {/* De beheerder ziet de link altijd, zodat hij kan nakijken of
                      hij de goede heeft gestuurd. */}
                  {bericht.tikkieLink && toonTikkieKnop && (
                    <a
                      href={bericht.tikkieLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cmt-flow-stat cmt-btn-primary !py-2 !text-sm mt-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Open de Tikkie
                    </a>
                  )}

                  {renderExtra?.(bericht)}

                  <p
                    className={`text-xs mt-1 ${vanMij ? 'text-right' : ''}`}
                    style={{ color: 'var(--cmt-ink-muted)' }}
                  >
                    {tijd(bericht.aangemaaktOp)}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={onderkant} />
      </div>

      <form
        onSubmit={verstuur}
        className="sticky bottom-0 pt-3 pb-1"
        style={{ background: 'var(--cmt-paper)' }}
      >
        {/* Een Tikkie-link hoort bij het bericht, niet in de tekst zelf: zo krijgt
            de klant er een echte knop bij in plaats van een kale URL. */}
        {tikkieOpen && (
          <div className="flex items-center gap-2 mb-2">
            <input
              className="cmt-input flex-1 !py-2 !text-sm"
              inputMode="url"
              placeholder="https://tikkie.me/pay/..."
              value={tikkieLink}
              onChange={(e) => setTikkieLink(e.target.value)}
              aria-label="Tikkie-link"
              autoFocus
            />
            <button
              type="button"
              className="cmt-btn-ghost !p-2"
              onClick={() => {
                setTikkieOpen(false);
                setTikkieLink('');
              }}
              aria-label="Tikkie-link weghalen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!linkGeldig && (
          <p className="text-xs mb-2" style={{ color: 'var(--cmt-error)' }}>
            Dat lijkt geen webadres. Plak de link uit Viatim, bijvoorbeeld
            tikkie.me/pay/iets.
          </p>
        )}

        <div className="flex gap-2">
          {magTikkieSturen && !tikkieOpen && (
            <button
              type="button"
              className="cmt-btn-secondary !px-3"
              onClick={() => setTikkieOpen(true)}
              title="Tikkie-link toevoegen"
            >
              <Link2 className="w-4 h-4" />
              <span className="sr-only">Tikkie-link toevoegen</span>
            </button>
          )}

          <input
            className="cmt-input flex-1"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            placeholder={tikkieOpen ? 'Schrijf er iets bij' : 'Typ een bericht'}
            maxLength={1000}
            aria-label="Bericht"
          />
          <button
            type="submit"
            className="cmt-btn-primary !px-4"
            disabled={!tekst.trim() || bezig || !linkGeldig}
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Versturen</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatVenster;
