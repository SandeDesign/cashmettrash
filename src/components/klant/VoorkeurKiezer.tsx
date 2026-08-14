// src/components/klant/VoorkeurKiezer.tsx
//
// De klant kiest hier wanneer het hem uitkomt. Dit is verplicht: er moet iemand
// thuis zijn als Jayce langskomt, dus we willen weten wanneer dat kan.
//
// Het blijft wel een voorkeur en geen harde afspraak: Jayce plant zijn ronde
// zelf en bevestigt daarna welk moment het echt wordt.

import React, { useEffect } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AlertCircle, CalendarClock } from 'lucide-react';
import { useInstellingenStore } from '../../store/instellingenStore';
import { volgendeKeer } from '../../utils/tijdsloten';

export interface Voorkeur {
  voorkeurTijdslotId: string;
  voorkeurVan: string;
  voorkeurTot: string;
}

interface VoorkeurKiezerProps {
  waarde: Voorkeur | null;
  onKies: (voorkeur: Voorkeur) => void;
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

  // Zonder tijden kan niemand een moment kiezen, en dus ook niets aanvragen.
  // Dat zeggen we hier eerlijk in plaats van een leeg blok te tonen.
  if (actief.length === 0) {
    return (
      <div className="cmt-alert cmt-alert-warning mb-5">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>
          Er staan op dit moment geen ophaaltijden klaar, dus we kunnen je aanvraag nog niet
          aannemen. Probeer het later opnieuw of stuur een berichtje.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <p className="cmt-label !mb-1">Wanneer kun je thuis zijn?</p>
      <p className="text-xs mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        Er moet iemand thuis zijn als Jayce langskomt, dus kies een moment dat jou uitkomt.
        Hij plant zijn ronde zelf en laat weten wanneer hij echt komt.
      </p>

      <div className="flex flex-wrap gap-2">
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
