// src/components/chat/ChatVenster.tsx
//
// Gedeeld gespreksvenster voor klant en admin. De klantkant krijgt bij een
// Tikkie-bericht extra knoppen mee via de renderExtra-prop.

import React, { useEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Send } from 'lucide-react';
import Loading from '../shared/Loading';
import type { ChatBericht } from '../../types';

interface ChatVensterProps {
  berichten: ChatBericht[];
  loading: boolean;
  /** Welke kant 'ik' ben; bepaalt links of rechts uitlijnen. */
  ikBen: 'klant' | 'admin';
  onVerstuur: (tekst: string) => Promise<void>;
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
  legeTekst = 'Nog geen berichten.',
}) => {
  const [tekst, setTekst] = useState('');
  const [bezig, setBezig] = useState(false);
  const onderkant = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onderkant.current?.scrollIntoView({ block: 'end' });
  }, [berichten.length]);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const schoon = tekst.trim();
    if (!schoon || bezig) return;

    setBezig(true);
    try {
      await onVerstuur(schoon);
      setTekst('');
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
                    {bericht.tekst}
                  </div>

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
        className="sticky bottom-0 flex gap-2 pt-3 pb-1"
        style={{ background: 'var(--cmt-paper)' }}
      >
        <input
          className="cmt-input flex-1"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Typ een bericht"
          maxLength={1000}
          aria-label="Bericht"
        />
        <button type="submit" className="cmt-btn-primary !px-4" disabled={!tekst.trim() || bezig}>
          <Send className="w-4 h-4" />
          <span className="sr-only">Versturen</span>
        </button>
      </form>
    </div>
  );
};

export default ChatVenster;
