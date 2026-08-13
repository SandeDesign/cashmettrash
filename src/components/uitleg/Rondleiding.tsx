// src/components/uitleg/Rondleiding.tsx
//
// Het rondleidingsvenster: stap voor stap door de app, met per stap de knop om
// meteen naar de pagina te springen waar het over gaat. Zo is het geen boekje
// maar iets waar je doorheen loopt.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { RondleidingStap } from './rondleidingStappen';

interface RondleidingProps {
  stappen: RondleidingStap[];
  titel: string;
  onSluiten: () => void;
}

const Rondleiding: React.FC<RondleidingProps> = ({ stappen, titel, onSluiten }) => {
  const navigate = useNavigate();
  const [nummer, setNummer] = useState(0);

  const stap = stappen[nummer];
  const eerste = nummer === 0;
  const laatste = nummer === stappen.length - 1;

  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSluiten();
      if (e.key === 'ArrowRight') setNummer((n) => Math.min(stappen.length - 1, n + 1));
      if (e.key === 'ArrowLeft') setNummer((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', opToets);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', opToets);
      document.body.style.overflow = '';
    };
  }, [onSluiten, stappen.length]);

  const springNaar = (pad: string) => {
    onSluiten();
    navigate(pad);
  };

  return (
    <div
      className="cmt-modal-backdrop"
      onClick={onSluiten}
      role="dialog"
      aria-modal="true"
      aria-label={titel}
    >
      <div
        className={`cmt-modal cmt-rondleiding ${stap.flow ? `cmt-flow-${stap.flow}` : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--cmt-ink-muted)' }}>
            {titel}
          </p>
          <button
            type="button"
            onClick={onSluiten}
            className="cmt-menu-sluit"
            aria-label="Uitleg sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* key zorgt dat elke stap opnieuw invliegt, anders staat de tekst er
            ineens en voelt het als één lange pagina. */}
        <div key={nummer} className="cmt-animate-in">
          <span className="cmt-rondleiding-icoon">{stap.icon}</span>
          <h2 className="text-xl font-bold mb-2">{stap.titel}</h2>
          <div className="cmt-rondleiding-tekst">{stap.tekst}</div>

          {stap.naar && stap.knop && (
            <button
              type="button"
              className="cmt-btn-secondary mt-4"
              onClick={() => springNaar(stap.naar!)}
            >
              {stap.knop} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="cmt-rondleiding-stippen" aria-hidden="true">
          {stappen.map((_, i) => (
            <span key={i} className={i === nummer ? 'is-hier' : i < nummer ? 'is-gehad' : ''} />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            className="cmt-btn-ghost"
            onClick={() => setNummer((n) => n - 1)}
            disabled={eerste}
          >
            <ArrowLeft className="w-4 h-4" /> Terug
          </button>

          <span className="text-sm ml-auto mr-1" style={{ color: 'var(--cmt-ink-muted)' }}>
            {nummer + 1} van {stappen.length}
          </span>

          {laatste ? (
            <button type="button" className="cmt-btn-primary" onClick={onSluiten}>
              <Check className="w-4 h-4" /> Ik snap het
            </button>
          ) : (
            <button
              type="button"
              className="cmt-btn-primary"
              onClick={() => setNummer((n) => n + 1)}
            >
              Verder <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rondleiding;
