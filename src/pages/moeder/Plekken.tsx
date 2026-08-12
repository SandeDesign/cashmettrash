// src/pages/moeder/Plekken.tsx
//
// Mama wijst hier plekken aan waar Jayce niet langs mag. De routeplanner maakt
// daar een omweg omheen: de gebieden gaan als verboden vlak mee naar de
// routedienst.

import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Trash2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import Kaart from '../../components/kaart/Kaart';
import { useAuth } from '../../hooks/useAuth';
import { useInstellingenStore } from '../../store/instellingenStore';
import type { Punt } from '../../utils/geo';

const STRALEN = [50, 100, 200];

const Plekken: React.FC = () => {
  const { user } = useAuth();
  const { werkgebied, plekken, loading, error, loadWerkgebied, loadPlekken, voegPlekToe, verwijderPlek } =
    useInstellingenStore();

  const [gekozen, setGekozen] = useState<Punt | null>(null);
  const [omschrijving, setOmschrijving] = useState('');
  const [straal, setStraal] = useState(100);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    loadWerkgebied();
    loadPlekken();
  }, [loadWerkgebied, loadPlekken]);

  const bewaar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gekozen || !user || !omschrijving.trim()) return;

    setBezig(true);
    try {
      await voegPlekToe({
        lat: gekozen.lat,
        lon: gekozen.lon,
        straalMeters: straal,
        omschrijving: omschrijving.trim(),
        aangemaaktDoor: user.uid,
      });
      setGekozen(null);
      setOmschrijving('');
    } finally {
      setBezig(false);
    }
  };

  return (
    <AppLayout nav={MOEDER_NAV} title="Gevaarlijke plekken">
      <p className="cmt-lead mb-5">
        Tik op de kaart waar Jayce niet langs mag, bijvoorbeeld een druk kruispunt. De
        routeplanner stuurt hem er dan omheen.
      </p>

      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      <Kaart
        midden={{ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon }}
        onKlik={setGekozen}
        markeringen={gekozen ? [{ punt: gekozen, label: '!', kleur: '#C0392B' }] : []}
        cirkels={[
          ...plekken.map((p) => ({
            punt: { lat: p.lat, lon: p.lon },
            straalMeters: p.straalMeters,
          })),
          ...(gekozen ? [{ punt: gekozen, straalMeters: straal }] : []),
        ]}
        hoogte="24rem"
      />

      {gekozen && (
        <form onSubmit={bewaar} className="cmt-card mt-4 cmt-animate-in">
          <h2 className="font-bold mb-3">Nieuwe plek markeren</h2>

          <div className="mb-4">
            <label className="cmt-label" htmlFor="omschrijving">
              Wat is hier gevaarlijk?
            </label>
            <input
              id="omschrijving"
              className="cmt-input"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              placeholder="Bijv. kruispunt zonder stoplicht"
              autoFocus
            />
          </div>

          <div className="mb-5">
            <p className="cmt-label">Hoe groot moet de omweg zijn?</p>
            <div className="flex gap-2">
              {STRALEN.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={straal === m ? 'cmt-btn-primary !py-2 !text-sm' : 'cmt-btn-ghost !py-2 !text-sm'}
                  onClick={() => setStraal(m)}
                >
                  {m} meter
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" className="cmt-btn-ghost" onClick={() => setGekozen(null)}>
              Annuleren
            </button>
            <button type="submit" className="cmt-btn-primary" disabled={bezig || !omschrijving.trim()}>
              {bezig ? 'Bezig...' : 'Plek opslaan'}
            </button>
          </div>
        </form>
      )}

      <h2 className="text-lg font-bold mt-8 mb-3">Plekken die vermeden worden</h2>

      {loading && plekken.length === 0 ? (
        <Loading />
      ) : plekken.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <MapPin className="w-6 h-6" />
          </span>
          <p>Nog geen plekken aangewezen. Tik op de kaart om te beginnen.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {plekken.map((plek) => (
            <li key={plek.id} className="cmt-card flex items-center gap-3">
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--cmt-error)' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{plek.omschrijving}</p>
                <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                  Omweg van {plek.straalMeters} meter
                </p>
              </div>
              <button
                className="cmt-btn-ghost !p-2"
                onClick={() => verwijderPlek(plek.id)}
                aria-label={`${plek.omschrijving} verwijderen`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  );
};

export default Plekken;
