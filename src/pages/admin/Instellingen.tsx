// src/pages/admin/Instellingen.tsx
//
// Het werkgebied: waar halen we op, hoe ver mag Jayce alleen, en vanaf hoeveel
// spullen is het te zwaar. Deze waarden sturen de aanmeldcontrole en de
// routeplanner.

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import Kaart from '../../components/kaart/Kaart';
import { useInstellingenStore } from '../../store/instellingenStore';
import type { Punt } from '../../utils/geo';

const Instellingen: React.FC = () => {
  const { werkgebied, loading, error, loadWerkgebied, bewaarWerkgebied } = useInstellingenStore();

  const [postcodes, setPostcodes] = useState('');
  const [middelpunt, setMiddelpunt] = useState<Punt | null>(null);
  const [straal, setStraal] = useState(1200);
  const [maxItems, setMaxItems] = useState(30);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

  useEffect(() => {
    loadWerkgebied();
  }, [loadWerkgebied]);

  useEffect(() => {
    setPostcodes(werkgebied.postcodes.join(', '));
    setMiddelpunt({ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon });
    setStraal(werkgebied.straalAlleenMeters);
    setMaxItems(werkgebied.maxItemsAlleen);
  }, [werkgebied]);

  const bewaar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!middelpunt) return;

    setBezig(true);
    setOpgeslagen(false);
    try {
      await bewaarWerkgebied({
        postcodes: postcodes
          .split(',')
          .map((p) => p.trim().toUpperCase())
          .filter(Boolean),
        middelpuntLat: middelpunt.lat,
        middelpuntLon: middelpunt.lon,
        straalAlleenMeters: straal,
        maxItemsAlleen: maxItems,
      });
      setOpgeslagen(true);
    } finally {
      setBezig(false);
    }
  };

  if (loading && !werkgebied.bijgewerktOp) {
    return (
      <AppLayout nav={ADMIN_NAV} title="Werkgebied">
        <Loading />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={ADMIN_NAV} title="Werkgebied">
      <form onSubmit={bewaar} className="max-w-xl">
        {error && (
          <div className="cmt-alert cmt-alert-error mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {opgeslagen && (
          <div className="cmt-alert cmt-alert-success mb-4">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Opgeslagen.</span>
          </div>
        )}

        <section className="cmt-card mb-5">
          <h2 className="font-bold mb-1">Waar halen we op?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Vul de eerste vier cijfers van de postcodes in, gescheiden door komma's. Wie hierbuiten
            woont kan niets aanvragen, tenzij je die persoon als bekende hebt aangevinkt. Laat je
            dit leeg, dan mag iedereen aanvragen.
          </p>
          <input
            className="cmt-input"
            value={postcodes}
            onChange={(e) => setPostcodes(e.target.value)}
            placeholder="5045, 5046, 5047"
            aria-label="Postcodes in het werkgebied"
          />
        </section>

        <section className="cmt-card mb-5">
          <h2 className="font-bold mb-1">Waar begint de ronde?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Tik op de kaart om het startpunt te verzetten. De cirkel laat zien hoe ver Jayce alleen
            op pad mag.
          </p>

          {middelpunt && (
            <Kaart
              midden={middelpunt}
              onKlik={setMiddelpunt}
              markeringen={[{ punt: middelpunt, label: 'T', kleur: '#14181F' }]}
              cirkels={[{ punt: middelpunt, straalMeters: straal, kleur: '#0E8F6C' }]}
              hoogte="20rem"
            />
          )}

          <div className="mt-4">
            <label className="cmt-label" htmlFor="straal">
              Zo ver mag Jayce alleen: {(straal / 1000).toFixed(1)} km
            </label>
            <input
              id="straal"
              type="range"
              min={200}
              max={5000}
              step={100}
              value={straal}
              onChange={(e) => setStraal(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </section>

        <section className="cmt-card mb-5">
          <h2 className="font-bold mb-1">Wanneer moet mama mee?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Pas als het allebei geldt: het adres ligt buiten de straal hierboven, én er staat
            minstens dit aantal flessen en blikjes klaar.
          </p>
          <label className="cmt-label" htmlFor="maxitems">
            Vanaf dit aantal stuks
          </label>
          <input
            id="maxitems"
            type="number"
            min={1}
            max={500}
            className="cmt-input !w-32"
            value={maxItems}
            onChange={(e) => setMaxItems(Math.max(1, Number(e.target.value) || 1))}
          />
        </section>

        <button type="submit" className="cmt-btn-primary" disabled={bezig}>
          <Save className="w-4 h-4" /> {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </AppLayout>
  );
};

export default Instellingen;
