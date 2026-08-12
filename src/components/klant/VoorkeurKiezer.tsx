// src/components/klant/VoorkeurKiezer.tsx
//
// De klant kan aangeven welk moment hem het beste uitkomt. Het blijft een wens:
// Jayce plant zijn ronde zelf en mag er van afwijken. Daarom staat er ook een
// keuze "maakt niet uit" bij, en is die de standaard.

import React, { useEffect } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarClock } from 'lucide-react';
import { useInstellingenStore } from '../../store/instellingenStore';
import { volgendeKeer } from '../../utils/tijdsloten';

export interface Voorkeur {
  voorkeurTijdslotId: string;
  voorkeurVan: string;
  voorkeurTot: string;
}

interface VoorkeurKiezerProps {
  waarde: Voorkeur | null;
  onKies: (voorkeur: Voorkeur | null) => void;
}

function dagInWoorden(datum: Date): string {
  if (isToday(datum)) return 'vandaag';
  if (isTomorrow(datum)) return 'morgen';
  return format(datum, 'EEEE d MMM', { locale: nl });
}

const VoorkeurKiezer: React.FC<VoorkeurKiezerProps> = ({ waarde, onKies }) => {
  const { tijdsloten, loadTijdsloten } = useInstellingenStore();

  useEffect(() => {
    loadTijdsloten();
  }, [loadTijdsloten]);

  const actief = tijdsloten.filter((s) => s.actief);
  if (actief.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="cmt-label !mb-1">Wanneer komt het jou het beste uit?</p>
      <p className="text-xs mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        Jayce plant zijn eigen ronde, dus dit is een wens en geen afspraak. Hij laat weten
        wanneer hij echt komt.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={waarde === null ? 'cmt-btn-primary !py-2 !text-sm' : 'cmt-btn-ghost !py-2 !text-sm'}
          onClick={() => onKies(null)}
        >
          Maakt niet uit
        </button>

        {actief.map((slot) => {
          const { van, tot } = volgendeKeer(slot);
          const gekozen = waarde?.voorkeurTijdslotId === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              className={gekozen ? 'cmt-btn-primary !py-2 !text-sm' : 'cmt-btn-ghost !py-2 !text-sm'}
              onClick={() =>
                onKies({
                  voorkeurTijdslotId: slot.id,
                  voorkeurVan: van.toISOString(),
                  voorkeurTot: tot.toISOString(),
                })
              }
            >
              <CalendarClock className="w-4 h-4" />
              <span className="capitalize">{dagInWoorden(van)}</span> {slot.van}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VoorkeurKiezer;
