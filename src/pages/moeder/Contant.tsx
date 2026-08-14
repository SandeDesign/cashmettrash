// src/pages/moeder/Contant.tsx
//
// Mama bevestigt hier dat Jayce contant geld heeft gekregen.
//
// Waarom dit een aparte pagina is: een klant kan kiezen om niet in de app te
// betalen maar het geld mee te geven aan Jayce. Dat kan bij allebei de stromen:
// de ophaalbeurt voor glas, en de ophaalkosten bij statiegeld. Het scheelt de
// klant een stap, maar dan moet iemand wel zien dat het geld er echt is. Jayce
// doet dat niet zelf: hij is tien en heeft geen bedragen op zijn pagina's.
//
// Zolang mama niets afvinkt geldt het geld als niet ontvangen. Bij statiegeld
// blijft de Tikkie van de klant dan op slot.
//
// Het statiegeld zelf staat hier los van. Dat komt uit de automaat van Viatim
// en gaat volledig naar de klant.

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Coins, HandCoins, Info, Recycle, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, GLAS_PRIJS_CENTEN, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';

const datum = (iso?: string) => (iso ? format(new Date(iso), 'd MMM', { locale: nl }) : '');

/** Eén regel op deze pagina, of het nu glas of statiegeld is. */
interface Rij {
  id: string;
  soort: 'glas' | 'statiegeld';
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  bedrag: number;
  waarvoor: string;
  opgehaaldOp?: string;
  bevestigdOp?: string;
}

const Contant: React.FC = () => {
  const { user } = useAuth();
  const {
    orders,
    loading: glasLaadt,
    loadAlle: loadGlas,
    bevestigContant: bevestigGlas,
  } = useGlasStore();
  const {
    logs,
    loading: statLaadt,
    loadAlle: loadStatiegeld,
    bevestigContant: bevestigStatiegeld,
  } = useStatiegeldStore();

  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const rijen = useMemo<Rij[]>(() => {
    const uitGlas: Rij[] = orders
      .filter((o) => o.contant && o.status !== 'geannuleerd')
      .map((o) => ({
        id: o.id,
        soort: 'glas',
        naam: o.customerNaam,
        adres: o.adres,
        postcode: o.postcode,
        plaats: o.plaats,
        bedrag: o.bedrag,
        waarvoor: 'de ophaalbeurt voor glas',
        opgehaaldOp: o.opgehaaldOp,
        bevestigdOp: o.contantBevestigdOp,
      }));

    const uitStatiegeld: Rij[] = logs
      .filter((l) => l.servicekostenContant)
      .map((l) => ({
        id: l.id,
        soort: 'statiegeld',
        naam: l.customerNaam,
        adres: l.adres,
        postcode: l.postcode,
        plaats: l.plaats,
        bedrag: l.servicekosten,
        waarvoor: 'de ophaalkosten bij statiegeld',
        opgehaaldOp: l.opgehaaldOp,
        bevestigdOp: l.contantBevestigdOp,
      }));

    return [...uitGlas, ...uitStatiegeld];
  }, [orders, logs]);

  // Jayce is er al geweest, dus het geld hoort nu in huis te zijn.
  const teBevestigen = rijen.filter((r) => !r.bevestigdOp && r.opgehaaldOp);
  // Hij moet er nog langs; hier hoeft nog niets te gebeuren.
  const komtNog = rijen.filter((r) => !r.bevestigdOp && !r.opgehaaldOp);
  const gedaan = rijen
    .filter((r) => r.bevestigdOp)
    .sort((a, b) => (b.bevestigdOp ?? '').localeCompare(a.bevestigdOp ?? ''))
    .slice(0, 10);

  const bevestig = async (rij: Rij) => {
    if (!user) return;
    setFout(null);
    setBezig(rij.id);
    try {
      if (rij.soort === 'glas') {
        await bevestigGlas(rij.id, user.uid);
      } else {
        await bevestigStatiegeld(rij.id, user.uid);
      }
      void stuurPushNaarRol('admin', {
        titel: 'Contant ontvangen',
        tekst: `${rij.naam} heeft ${formatCenten(rij.bedrag)} contant meegegeven voor ${rij.waarvoor}.`,
        url: rij.soort === 'glas' ? '/admin/glas' : '/admin/statiegeld',
      });
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Bevestigen lukte niet');
    } finally {
      setBezig(null);
    }
  };

  const merk = (soort: 'glas' | 'statiegeld') =>
    soort === 'glas' ? (
      <span className="cmt-badge cmt-badge-glas">
        <Wine className="w-3.5 h-3.5" /> Glas
      </span>
    ) : (
      <span className="cmt-badge cmt-badge-stat">
        <Recycle className="w-3.5 h-3.5" /> Statiegeld
      </span>
    );

  return (
    <AppLayout nav={MOEDER_NAV} title="Contant geld">
      <div className="cmt-card cmt-card-tint mb-5">
        <p className="font-bold flex items-center gap-2 mb-2">
          <Info className="w-5 h-5" />
          Waarvoor is deze pagina?
        </p>
        <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
          Een klant kan het geld contant meegeven aan Jayce in plaats van in de app te betalen. Dat
          kan bij glas ({formatCenten(GLAS_PRIJS_CENTEN)} voor de ophaalbeurt) en bij statiegeld (
          {formatCenten(STATIEGELD_SERVICE_CENTEN)} ophaalkosten). Het gaat sneller, maar het geld
          moet natuurlijk wel aankomen. Krijg je het van Jayce, vink het hieronder dan af.
        </p>
        <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--cmt-ink-soft)' }}>
          <li>
            1. Jayce haalt op en krijgt het geld mee. Op zijn pagina staat dat hij het aan jou moet
            geven.
          </li>
          <li>2. Jij krijgt het thuis van hem en vinkt het hier af.</li>
          <li>
            3. Pas daarna telt het als betaald. Bij statiegeld komt dan ook de knop naar de Tikkie
            bij de klant vrij.
          </li>
        </ul>
        <p className="text-sm mt-2" style={{ color: 'var(--cmt-ink-soft)' }}>
          <strong>Heeft Jayce het geld niet gekregen?</strong> Vink dan niets af en zeg het tegen de
          beheerder. De klant kan het dan alsnog gewoon in de app betalen.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
          Het statiegeld zelf staat hier los van. Dat komt uit de automaat en gaat volledig naar de
          klant. Afvinken kan niet ongedaan gemaakt worden; lukt het toch niet, vraag het dan aan de
          beheerder.
        </p>
      </div>

      {fout && <div className="cmt-alert cmt-alert-error mb-4">{fout}</div>}

      {(glasLaadt || statLaadt) && rijen.length === 0 && <Loading />}

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <HandCoins className="w-5 h-5" />
          Heeft Jayce dit geld gegeven?
          {teBevestigen.length > 0 && (
            <span className="cmt-badge cmt-badge-warning">{teBevestigen.length}</span>
          )}
        </h2>

        {teBevestigen.length === 0 ? (
          <div className="cmt-card cmt-empty-state !py-6">
            <span className="cmt-empty-state-icon">
              <Check className="w-6 h-6" />
            </span>
            <p>Er wacht niets op jou. Alles wat contant is meegegeven is afgevinkt.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {teBevestigen.map((rij) => (
              <li
                key={`${rij.soort}-${rij.id}`}
                className={`cmt-flow-${rij.soort === 'glas' ? 'glas' : 'stat'} cmt-card cmt-card-flow`}
              >
                <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="font-bold">{rij.naam}</p>
                    <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                      {rij.adres}, {rij.postcode} {rij.plaats}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                      Opgehaald op {datum(rij.opgehaaldOp)} · voor {rij.waarvoor}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-center">
                    {merk(rij.soort)}
                    <span className="cmt-badge cmt-badge-neutral">
                      <Coins className="w-3.5 h-3.5" /> {formatCenten(rij.bedrag)}
                    </span>
                  </div>
                </div>

                <button
                  className="cmt-btn-primary cmt-btn-block mt-3"
                  disabled={bezig === rij.id}
                  onClick={() => bevestig(rij)}
                >
                  <Check className="w-4 h-4" />
                  {bezig === rij.id
                    ? 'Bezig...'
                    : `Ja, ik heb ${formatCenten(rij.bedrag)} van Jayce gekregen`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {komtNog.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Jayce moet hier nog langs</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-soft)' }}>
            Deze klanten leggen het geld klaar. Zodra Jayce is geweest verschijnen ze hierboven.
          </p>
          <ul className="space-y-2">
            {komtNog.map((rij) => (
              <li key={`${rij.soort}-${rij.id}`} className="cmt-card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{rij.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {rij.adres}
                  </p>
                </div>
                {merk(rij.soort)}
                <span className="cmt-badge cmt-badge-neutral">{formatCenten(rij.bedrag)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gedaan.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Al afgevinkt</h2>
          <ul className="space-y-2">
            {gedaan.map((rij) => (
              <li key={`${rij.soort}-${rij.id}`} className="cmt-card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{rij.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                    Afgevinkt op {datum(rij.bevestigdOp)}
                  </p>
                </div>
                {merk(rij.soort)}
                <span className="cmt-badge cmt-badge-done">
                  <Check className="w-3.5 h-3.5" /> {formatCenten(rij.bedrag)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppLayout>
  );
};

export default Contant;
