// src/components/jayce/TijdslotKiezer.tsx
//
// Jayce kiest hier wanneer hij langskomt. Hij ziet alleen de momenten die mama
// of de beheerder heeft klaargezet, en per moment de eerstvolgende datum, zodat
// hij niet zelf hoeft uit te rekenen welke woensdag het is.

import React, { useState } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarClock, Check } from 'lucide-react';
import { volgendeKeer } from '../../utils/tijdsloten';
import type { Tijdslot } from '../../types';

interface TijdslotKiezerProps {
  sloten: Tijdslot[];
  /** Het moment dat de klant het handigst vond. Dat zetten we bovenaan. */
  voorkeurId?: string;
  onKiezen: (slot: Tijdslot, van: Date, tot: Date) => Promise<void>;
  onAnnuleren: () => void;
}

/** "vandaag", "morgen" of "woensdag 20 augustus". */
function dagInWoorden(datum: Date): string {
  if (isToday(datum)) return 'vandaag';
  if (isTomorrow(datum)) return 'morgen';
  return format(datum, 'EEEE d MMMM', { locale: nl });
}

const TijdslotKiezer: React.FC<TijdslotKiezerProps> = ({
  sloten,
  voorkeurId,
  onKiezen,
  onAnnuleren,
}) => {
  const [bezigMet, setBezigMet] = useState<string | null>(null);

  // De wens van de klant bovenaan, de rest daaronder in de gewone volgorde.
  const actief = sloten
    .filter((s) => s.actief)
    .sort((a, b) => Number(b.id === voorkeurId) - Number(a.id === voorkeurId));

  if (actief.length === 0) {
    return (
      <div className="cmt-card cmt-card-tint !p-4 mt-4">
        <p className="text-base font-semibold mb-1">Er staan nog geen tijden klaar</p>
        <p className="text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
          Vraag mama of papa om tijden in te stellen. Dan kun je hier kiezen wanneer je gaat.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 cmt-animate-in">
      <p className="text-base font-semibold mb-1">Wanneer ga je erheen?</p>
      <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        Kies een moment. Ze krijgen dan te horen dat je komt.
      </p>

      <ul className="space-y-2">
        {actief.map((slot) => {
          const { van, tot } = volgendeKeer(slot);
          const bezig = bezigMet === slot.id;

          return (
            <li key={slot.id}>
              <button
                type="button"
                className="cmt-tijdslot"
                disabled={bezigMet !== null}
                onClick={async () => {
                  setBezigMet(slot.id);
                  try {
                    await onKiezen(slot, van, tot);
                  } finally {
                    setBezigMet(null);
                  }
                }}
              >
                <span className="cmt-tijdslot-icoon">
                  <CalendarClock className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">
                  <span className="block font-bold capitalize">{dagInWoorden(van)}</span>
                  <span className="block text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                    van {slot.van} tot {slot.tot}
                  </span>
                  {slot.id === voorkeurId && (
                    <span className="cmt-badge cmt-badge-stat mt-1">Dit wil de klant graag</span>
                  )}
                </span>
                {bezig ? (
                  <span className="cmt-spinner" aria-hidden="true" />
                ) : (
                  <Check className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="cmt-btn-ghost mt-3" onClick={onAnnuleren}>
        Toch niet
      </button>
    </div>
  );
};

export default TijdslotKiezer;
