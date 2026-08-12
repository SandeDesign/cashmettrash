// src/pages/jayce/Score.tsx
//
// De cijferpagina van Jayce. Bewust zonder één bedrag: hij ziet hoeveel hij heeft
// gedaan, niet wat het opbrengt. Taal en opbouw zijn voor een tienjarige.

import React, { useEffect, useMemo } from 'react';
import { Award, Flame, PiggyBank, Recycle, Trophy, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { JAYCE_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten } from '../../utils/constants';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const Tegel: React.FC<{
  icon: React.ReactNode;
  waarde: number | string;
  label: string;
  flow: 'glas' | 'stat';
}> = ({ icon, waarde, label, flow }) => (
  <div className={`cmt-flow-${flow} cmt-card cmt-card-tint text-center`}>
    <span
      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-2"
      style={{ background: 'var(--cmt-surface)', color: 'var(--cmt-accent)' }}
    >
      {icon}
    </span>
    <p className="text-3xl font-bold" style={{ color: 'var(--cmt-accent)' }}>
      {waarde}
    </p>
    <p className="text-sm mt-0.5" style={{ color: 'var(--cmt-ink-soft)' }}>
      {label}
    </p>
  </div>
);

const Score: React.FC = () => {
  const { user } = useAuth();
  const { orders, loading: glasLaadt, loadAlle: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadAlle: loadStatiegeld } = useStatiegeldStore();

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const score = useMemo(() => {
    const mijnGlas = orders.filter((o) => o.jayceId === user?.uid && o.opgehaaldOp);
    const mijnStat = logs.filter((l) => l.jayceId === user?.uid && l.opgehaaldOp);
    const grens = Date.now() - WEEK_MS;

    const dezeWeek =
      mijnGlas.filter((o) => new Date(o.opgehaaldOp!).getTime() >= grens).length +
      mijnStat.filter((l) => new Date(l.opgehaaldOp!).getTime() >= grens).length;

    const flesjes = mijnStat.reduce((som, l) => som + (l.itemsWerkelijk?.plastic ?? 0), 0);
    const blikjes = mijnStat.reduce((som, l) => som + (l.itemsWerkelijk?.blik ?? 0), 0);

    // Op hoeveel verschillende dagen ben je op pad geweest?
    const dagen = new Set(
      [...mijnGlas, ...mijnStat].map((x) => new Date(x.opgehaaldOp!).toDateString())
    );

    // Het enige bedrag dat Jayce te zien krijgt: zijn eigen potje. Dat zijn de
    // keren dat iemand zijn statiegeld aan hem heeft geschonken.
    const geschonkenLogs = logs.filter((l) => l.geschonken && l.tikkieBedrag);
    const potje = geschonkenLogs.reduce((som, l) => som + (l.tikkieBedrag ?? 0), 0);

    return {
      totaal: mijnGlas.length + mijnStat.length,
      dezeWeek,
      glas: mijnGlas.length,
      flesjes,
      blikjes,
      dagen: dagen.size,
      potje,
      giften: geschonkenLogs.length,
    };
  }, [orders, logs, user]);

  if ((glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0) {
    return (
      <AppLayout nav={JAYCE_NAV} title="Mijn score">
        <Loading text="Momentje..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={JAYCE_NAV} title="Mijn score">
      <div className="cmt-card cmt-flow-glas cmt-card-flow mb-6">
        <Trophy className="w-8 h-8 mb-2" style={{ color: 'var(--cmt-glas)' }} />
        <p className="text-4xl font-bold" style={{ color: 'var(--cmt-glas)' }}>
          {score.totaal}
        </p>
        <p className="text-base font-semibold">
          {score.totaal === 1 ? 'keer opgehaald' : 'keer opgehaald'}, in totaal
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
          {score.totaal === 0
            ? 'Je bent nog niet begonnen. Straks staat hier je eerste ophaalbeurt!'
            : 'Netjes gedaan. Elke keer telt mee.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Tegel
          flow="glas"
          icon={<Flame className="w-6 h-6" />}
          waarde={score.dezeWeek}
          label="deze week opgehaald"
        />
        <Tegel
          flow="glas"
          icon={<Award className="w-6 h-6" />}
          waarde={score.dagen}
          label={score.dagen === 1 ? 'dag op pad geweest' : 'dagen op pad geweest'}
        />
        <Tegel
          flow="glas"
          icon={<Wine className="w-6 h-6" />}
          waarde={score.glas}
          label="kratten glas"
        />
        <Tegel
          flow="stat"
          icon={<Recycle className="w-6 h-6" />}
          waarde={score.flesjes + score.blikjes}
          label="flesjes en blikjes geteld"
        />
      </div>

      <div className="cmt-card cmt-flow-stat cmt-card-flow mb-6">
        <PiggyBank className="w-8 h-8 mb-2" style={{ color: 'var(--cmt-stat)' }} />
        <p className="text-4xl font-bold" style={{ color: 'var(--cmt-stat)' }}>
          {formatCenten(score.potje)}
        </p>
        <p className="text-base font-semibold">zit er in jouw potje</p>
        <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-soft)' }}>
          {score.giften === 0
            ? 'Nog niemand heeft zijn statiegeld aan jou gegeven. Dat kan later nog komen.'
            : `${score.giften === 1 ? 'Eén keer heeft' : `${score.giften} keer hebben`} mensen hun statiegeld aan jou gegeven. Papa bewaart het voor je.`}
        </p>
      </div>

      {score.flesjes + score.blikjes > 0 && (
        <div className="cmt-card cmt-flow-stat cmt-card-tint">
          <p className="font-bold mb-1">Wist je dat?</p>
          <p className="text-base" style={{ color: 'var(--cmt-ink-soft)' }}>
            Je hebt {score.flesjes} flesjes en {score.blikjes} blikjes opgehaald. Die zijn allemaal
            netjes ingeleverd in plaats van weggegooid. Goed bezig!
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Score;
