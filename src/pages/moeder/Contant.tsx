// src/pages/moeder/Contant.tsx
//
// Mama bevestigt hier dat Jayce de ophaalkosten contant heeft gekregen.
//
// Waarom dit een aparte pagina is: de klant kan ervoor kiezen om de EUR 2,00
// niet in de app te betalen maar mee te geven aan Jayce. Dat scheelt de klant
// een stap, maar dan moet iemand wel zien dat het geld er echt is. Jayce doet
// dat niet zelf: hij is tien en heeft geen bedragen op zijn pagina's. Zolang
// mama het niet heeft afgevinkt blijft de Tikkie van de klant op slot.
//
// Het statiegeld zelf staat hier los van. Dat komt uit de automaat van Viatim
// en gaat volledig naar de klant.

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, Coins, HandCoins, Info } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';
import { stuurPushNaarRol } from '../../utils/push';

const datum = (iso?: string) => (iso ? format(new Date(iso), 'd MMM', { locale: nl }) : '');

const Contant: React.FC = () => {
  const { user } = useAuth();
  const { logs, loading, loadAlle, bevestigContant } = useStatiegeldStore();
  const [bezig, setBezig] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    loadAlle();
  }, [loadAlle]);

  const contant = useMemo(() => logs.filter((l) => l.servicekostenContant), [logs]);

  // Jayce is er al geweest, dus het geld hoort nu in huis te zijn.
  const teBevestigen = contant.filter((l) => !l.contantBevestigdOp && l.opgehaaldOp);
  // Hij moet er nog langs; hier hoeft nog niets te gebeuren.
  const komtNog = contant.filter((l) => !l.contantBevestigdOp && !l.opgehaaldOp);
  const gedaan = contant
    .filter((l) => l.contantBevestigdOp)
    .sort((a, b) => (b.contantBevestigdOp ?? '').localeCompare(a.contantBevestigdOp ?? ''))
    .slice(0, 10);

  const bevestig = async (logId: string, naam: string, bedrag: number) => {
    if (!user) return;
    setFout(null);
    setBezig(logId);
    try {
      await bevestigContant(logId, user.uid);
      void stuurPushNaarRol('admin', {
        titel: 'Contant ontvangen',
        tekst: `${naam} heeft ${formatCenten(bedrag)} ophaalkosten contant meegegeven.`,
        url: '/admin/statiegeld',
      });
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Bevestigen lukte niet');
    } finally {
      setBezig(null);
    }
  };

  return (
    <AppLayout nav={MOEDER_NAV} title="Contant geld">
      <div className="cmt-flow-stat">
        <div className="cmt-card cmt-card-tint mb-5">
          <p className="font-bold flex items-center gap-2 mb-2">
            <Info className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
            Waarvoor is deze pagina?
          </p>
          <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
            Een klant kan de ophaalkosten van {formatCenten(STATIEGELD_SERVICE_CENTEN)} contant
            meegeven aan Jayce in
            plaats van ze in de app te betalen. Dat gaat sneller, maar het geld moet natuurlijk wel
            aankomen. Krijg je het muntje van Jayce, vink de klant hieronder dan af.
          </p>
          <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--cmt-ink-soft)' }}>
            <li>
              1. Jayce haalt op en krijgt het geld mee. Op zijn pagina staat dat hij het aan jou
              moet geven.
            </li>
            <li>2. Jij krijgt het thuis van hem en vinkt het hier af.</li>
            <li>
              3. Pas daarna komt de knop naar de Tikkie bij de klant vrij. Zolang jij niets
              afvinkt blijft die op slot.
            </li>
          </ul>
          <p className="text-xs mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
            Het statiegeld zelf staat hier los van. Dat komt uit de automaat en gaat volledig naar
            de klant.
          </p>
        </div>

        {fout && <div className="cmt-alert cmt-alert-error mb-4">{fout}</div>}

        {loading && logs.length === 0 && <Loading />}

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <HandCoins className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
            Heeft Jayce dit geld gegeven?
            {teBevestigen.length > 0 && (
              <span className="cmt-badge cmt-badge-stat">{teBevestigen.length}</span>
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
              {teBevestigen.map((log) => (
                <li key={log.id} className="cmt-card cmt-card-flow">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="flex-1 min-w-[12rem]">
                      <p className="font-bold">{log.customerNaam}</p>
                      <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                        {log.adres}, {log.postcode} {log.plaats}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                        Opgehaald op {datum(log.opgehaaldOp)}
                      </p>
                    </div>
                    <span className="cmt-badge cmt-badge-stat self-center">
                      <Coins className="w-3.5 h-3.5" /> {formatCenten(log.servicekosten)}
                    </span>
                  </div>

                  <button
                    className="cmt-btn-primary cmt-btn-block mt-3"
                    disabled={bezig === log.id}
                    onClick={() => bevestig(log.id, log.customerNaam, log.servicekosten)}
                  >
                    <Check className="w-4 h-4" />
                    {bezig === log.id
                      ? 'Bezig...'
                      : `Ja, ik heb ${formatCenten(log.servicekosten)} van Jayce gekregen`}
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
              {komtNog.map((log) => (
                <li key={log.id} className="cmt-card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{log.customerNaam}</p>
                    <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                      {log.adres}
                    </p>
                  </div>
                  <span className="cmt-badge cmt-badge-neutral">
                    {formatCenten(log.servicekosten)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {gedaan.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Al afgevinkt</h2>
            <ul className="space-y-2">
              {gedaan.map((log) => (
                <li key={log.id} className="cmt-card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{log.customerNaam}</p>
                    <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                      Afgevinkt op {datum(log.contantBevestigdOp)}
                    </p>
                  </div>
                  <span className="cmt-badge cmt-badge-done">
                    <Check className="w-3.5 h-3.5" /> {formatCenten(log.servicekosten)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Contant;
