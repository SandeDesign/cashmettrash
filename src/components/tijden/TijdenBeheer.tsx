// src/components/tijden/TijdenBeheer.tsx
//
// De tijden waarop Jayce langs mag komen. Mama en de beheerder zetten hier
// dezelfde lijst op; Jayce kiest er bij het bevestigen eentje uit. Een tijd
// herhaalt zich elke week, dus je vult alleen een dag en twee tijdstippen in.

import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import Loading from '../shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useInstellingenStore } from '../../store/instellingenStore';
import { DAGEN } from '../../utils/tijdsloten';

/** Maandag tot en met zondag, in de volgorde waarin je ze verwacht. */
const DAGKEUZE = [1, 2, 3, 4, 5, 6, 0];

const TijdenBeheer: React.FC = () => {
  const { user } = useAuth();
  const {
    tijdsloten,
    loading,
    error,
    loadTijdsloten,
    voegTijdslotToe,
    zetTijdslotActief,
    verwijderTijdslot,
  } = useInstellingenStore();

  const [dag, setDag] = useState(3);
  const [van, setVan] = useState('16:00');
  const [tot, setTot] = useState('17:30');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    loadTijdsloten();
  }, [loadTijdsloten]);

  const voegToe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (van >= tot) {
      setFout('De eindtijd moet later zijn dan de begintijd.');
      return;
    }

    const bestaat = tijdsloten.some(
      (s) => s.dagVanDeWeek === dag && s.van === van && s.tot === tot
    );
    if (bestaat) {
      setFout('Deze tijd staat er al in.');
      return;
    }

    setFout(null);
    setBezig(true);
    try {
      await voegTijdslotToe({
        dagVanDeWeek: dag,
        van,
        tot,
        actief: true,
        aangemaaktDoor: user.uid,
      });
    } finally {
      setBezig(false);
    }
  };

  return (
    <>
      <p className="cmt-lead mb-5">
        Op deze momenten mag Jayce op pad. Hij kiest er zelf eentje uit zodra hij een aanvraag
        bevestigt, en de klant krijgt dan te horen wanneer hij komt.
      </p>

      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      <form onSubmit={voegToe} className="cmt-card mb-6">
        <h2 className="font-bold mb-4">Een tijd toevoegen</h2>

        {fout && <div className="cmt-alert cmt-alert-error mb-4">{fout}</div>}

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="cmt-label" htmlFor="dag">
              Welke dag
            </label>
            <select
              id="dag"
              className="cmt-select"
              value={dag}
              onChange={(e) => setDag(Number(e.target.value))}
            >
              {DAGKEUZE.map((d) => (
                <option key={d} value={d}>
                  {DAGEN[d].charAt(0).toUpperCase() + DAGEN[d].slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="cmt-label" htmlFor="van">
              Van
            </label>
            <input
              id="van"
              type="time"
              className="cmt-input"
              value={van}
              onChange={(e) => setVan(e.target.value)}
            />
          </div>
          <div>
            <label className="cmt-label" htmlFor="tot">
              Tot
            </label>
            <input
              id="tot"
              type="time"
              className="cmt-input"
              value={tot}
              onChange={(e) => setTot(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="cmt-btn-primary" disabled={bezig}>
          <Plus className="w-4 h-4" /> {bezig ? 'Bezig...' : 'Toevoegen'}
        </button>
      </form>

      <h2 className="text-lg font-bold mb-3">Ingestelde tijden</h2>

      {loading && tijdsloten.length === 0 ? (
        <Loading />
      ) : tijdsloten.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <CalendarClock className="w-6 h-6" />
          </span>
          <p>
            Er staan nog geen tijden klaar. Zolang die er niet zijn kan Jayce geen aanvraag
            bevestigen.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tijdsloten.map((slot) => (
            <li key={slot.id} className="cmt-card flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="cmt-tijdslot-icoon">
                <CalendarClock className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-[9rem]">
                <p className="font-semibold capitalize">{DAGEN[slot.dagVanDeWeek]}</p>
                <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                  {slot.van} tot {slot.tot}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={slot.actief}
                  onChange={(e) => zetTijdslotActief(slot.id, e.target.checked)}
                />
                Aan
              </label>

              <button
                className="cmt-btn-ghost !p-2"
                onClick={() => verwijderTijdslot(slot.id)}
                aria-label={`${DAGEN[slot.dagVanDeWeek]} ${slot.van} verwijderen`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm mt-4" style={{ color: 'var(--cmt-ink-muted)' }}>
        Zet een tijd op uit als hij tijdelijk niet kan, bijvoorbeeld in een vakantieweek. Dan
        blijft hij bewaard maar kan Jayce hem niet kiezen.
      </p>
    </>
  );
};

export default TijdenBeheer;
