// src/pages/admin/Instellingen.tsx
//
// Het werkgebied: waar halen we op, hoe ver mag Jayce alleen, en vanaf hoeveel
// spullen is het te zwaar. Deze waarden sturen de aanmeldcontrole en de
// routeplanner.

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Home, Save, Search } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import Kaart from '../../components/kaart/Kaart';
import AantalVeld from '../../components/common/AantalVeld';
import { useInstellingenStore } from '../../store/instellingenStore';
import { routeplannerBeschikbaar, zoekCoordinaten, type Punt } from '../../utils/geo';

const Instellingen: React.FC = () => {
  const { werkgebied, loading, error, loadWerkgebied, bewaarWerkgebied } = useInstellingenStore();

  const [postcodes, setPostcodes] = useState('');
  const [thuisAdres, setThuisAdres] = useState('');
  const [thuisPostcode, setThuisPostcode] = useState('');
  const [thuisPlaats, setThuisPlaats] = useState('');
  const [zoekt, setZoekt] = useState(false);
  const [zoekFout, setZoekFout] = useState<string | null>(null);
  const [middelpunt, setMiddelpunt] = useState<Punt | null>(null);
  const [straal, setStraal] = useState(1200);
  const [maxAfstand, setMaxAfstand] = useState(3000);
  const [maxItems, setMaxItems] = useState(30);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

  useEffect(() => {
    loadWerkgebied();
  }, [loadWerkgebied]);

  useEffect(() => {
    setPostcodes(werkgebied.postcodes.join(', '));
    setThuisAdres(werkgebied.thuisAdres ?? '');
    setThuisPostcode(werkgebied.thuisPostcode ?? '');
    setThuisPlaats(werkgebied.thuisPlaats ?? '');
    setMiddelpunt({ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon });
    setStraal(werkgebied.straalAlleenMeters);
    setMaxAfstand(werkgebied.maxAfstandMeters);
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
        thuisAdres: thuisAdres.trim(),
        thuisPostcode: thuisPostcode.trim(),
        thuisPlaats: thuisPlaats.trim(),
        middelpuntLat: middelpunt.lat,
        middelpuntLon: middelpunt.lon,
        straalAlleenMeters: straal,
        // De buitengrens kan nooit binnen de straal liggen waar hij alleen mag.
        maxAfstandMeters: Math.max(straal, maxAfstand),
        maxItemsAlleen: maxItems,
      });
      setOpgeslagen(true);
    } finally {
      setBezig(false);
    }
  };

  /** Zet het middelpunt op het ingevulde thuisadres. */
  const zoekThuis = async () => {
    setZoekt(true);
    setZoekFout(null);
    try {
      const punt = await zoekCoordinaten(thuisAdres, thuisPostcode, thuisPlaats);
      if (punt) setMiddelpunt(punt);
      else setZoekFout('Dat adres wordt niet herkend. Controleer de spelling en de postcode.');
    } finally {
      setZoekt(false);
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

        {!routeplannerBeschikbaar && (
          <div className="cmt-alert cmt-alert-warning mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              Er is nog geen kaartsleutel ingesteld (VITE_ORS_API_KEY). Zonder die sleutel kan de
              app adressen niet omzetten naar coördinaten, en dus ook niet op afstand
              controleren. Alleen de postcodes hieronder blokkeren dan nog.
            </span>
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
            Vul jullie eigen adres in en laat het opzoeken. Dit is het punt waar Jayce vertrekt
            en weer terugkomt, en waar de cirkels omheen liggen. Klopt de stip niet helemaal? Tik
            dan op de kaart om hem te verplaatsen.
          </p>

          <div className="grid sm:grid-cols-[2fr,1fr,1.5fr] gap-3 mb-3">
            <div>
              <label className="cmt-label" htmlFor="thuisadres">
                Straat en huisnummer
              </label>
              <input
                id="thuisadres"
                className="cmt-input"
                value={thuisAdres}
                onChange={(e) => setThuisAdres(e.target.value)}
                placeholder="Magriethof 1"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="cmt-label" htmlFor="thuispostcode">
                Postcode
              </label>
              <input
                id="thuispostcode"
                className="cmt-input"
                value={thuisPostcode}
                onChange={(e) => setThuisPostcode(e.target.value)}
                placeholder="5045 AB"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="cmt-label" htmlFor="thuisplaats">
                Plaats
              </label>
              <input
                id="thuisplaats"
                className="cmt-input"
                value={thuisPlaats}
                onChange={(e) => setThuisPlaats(e.target.value)}
                placeholder="Tilburg"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="button"
            className="cmt-btn-secondary mb-4"
            onClick={zoekThuis}
            disabled={zoekt || !routeplannerBeschikbaar || !thuisAdres.trim() || !thuisPlaats.trim()}
          >
            <Search className="w-4 h-4" />
            {zoekt ? 'Zoeken...' : 'Zet de stip op dit adres'}
          </button>

          {zoekFout && <div className="cmt-alert cmt-alert-error mb-4">{zoekFout}</div>}

          {middelpunt && (
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: 'var(--cmt-ink-muted)' }}>
              <Home className="w-3.5 h-3.5" />
              Stip staat nu op {middelpunt.lat.toFixed(5)}, {middelpunt.lon.toFixed(5)}
            </p>
          )}

          {middelpunt && (
            <Kaart
              midden={middelpunt}
              onKlik={setMiddelpunt}
              markeringen={[{ punt: middelpunt, label: 'T', kleur: '#14181F' }]}
              cirkels={[
                { punt: middelpunt, straalMeters: straal, kleur: '#0E8F6C' },
                { punt: middelpunt, straalMeters: Math.max(straal, maxAfstand), kleur: '#0B4A9E' },
              ]}
              hoogte="20rem"
            />
          )}

          <div className="mt-4">
            <label className="cmt-label" htmlFor="straal">
              Groene cirkel, zo ver mag Jayce alleen: {(straal / 1000).toFixed(1)} km
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

          <div className="mt-4">
            <label className="cmt-label" htmlFor="maxafstand">
              Blauwe cirkel, hier houdt de ronde op:{' '}
              {(Math.max(straal, maxAfstand) / 1000).toFixed(1)} km
            </label>
            <input
              id="maxafstand"
              type="range"
              min={200}
              max={15000}
              step={100}
              value={Math.max(straal, maxAfstand)}
              onChange={(e) => setMaxAfstand(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
              Wie hierbuiten woont kan niets aanvragen, ook niet met mama erbij. Alleen een
              bekende mag hier overheen.
            </p>
          </div>
        </section>

        <section className="cmt-card mb-5">
          <h2 className="font-bold mb-1">Wanneer moet mama mee?</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
            Pas als het allebei geldt: het adres ligt buiten de straal hierboven, én er staat
            minstens dit aantal flessen en blikjes klaar.
          </p>
          <div className="max-w-[8rem]">
            <AantalVeld
              id="maxitems"
              label="Vanaf dit aantal stuks"
              waarde={maxItems}
              onChange={setMaxItems}
              min={1}
              max={500}
            />
          </div>
        </section>

        <button type="submit" className="cmt-btn-primary" disabled={bezig}>
          <Save className="w-4 h-4" /> {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
      </form>
    </AppLayout>
  );
};

export default Instellingen;
