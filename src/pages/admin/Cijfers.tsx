// src/pages/admin/Cijfers.tsx
//
// Alle getallen bij elkaar. Ze stonden eerder op het dashboard, maar daar leidden
// ze af van wat er te doen is.

import React, { useEffect, useMemo, useState } from 'react';
import { Euro, PiggyBank, Recycle, TrendingUp, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten, VIATIM_CENT_PER_ITEM, viatimVergoeding } from '../../utils/constants';

const DAG_MS = 24 * 60 * 60 * 1000;

const PERIODES = [
  { label: 'Deze week', dagen: 7 },
  { label: 'Deze maand', dagen: 30 },
  { label: 'Alles', dagen: 0 },
] as const;

const Tegel: React.FC<{
  label: string;
  waarde: string;
  toelichting: string;
  icon: React.ReactNode;
  flow: 'glas' | 'stat';
}> = ({ label, waarde, toelichting, icon, flow }) => (
  <div className={`cmt-flow-${flow} cmt-card cmt-card-flow`}>
    <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--cmt-accent)' }}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
    <p className="text-2xl font-bold">{waarde}</p>
    <p className="text-xs mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
      {toelichting}
    </p>
  </div>
);

const Cijfers: React.FC = () => {
  const { orders, loading: glasLaadt, loadAlle: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadAlle: loadStatiegeld } = useStatiegeldStore();
  const [periode, setPeriode] = useState<number>(7);

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const cijfers = useMemo(() => {
    const grens = periode === 0 ? 0 : Date.now() - periode * DAG_MS;
    const binnen = (iso?: string) => !!iso && new Date(iso).getTime() >= grens;

    const betaaldeOrders = orders.filter((o) => binnen(o.betaaldOp));
    const opgehaaldeLogs = logs.filter((l) => binnen(l.opgehaaldOp));
    const betaaldeKosten = logs.filter(
      (l) => l.servicekostenStatus === 'betaald' && binnen(l.servicekostenBetaaldOp)
    );

    // Wat er echt is ingeleverd bij Viatim. Daarover krijgen wij de vergoeding
    // per verpakking; het statiegeld zelf zit daar niet in.
    const isIngeleverd = (status: string) =>
      status === 'verwerktBijViatim' || status === 'tikkieVerstuurd';
    const telItems = (lijst: typeof logs) =>
      lijst.reduce((som, l) => {
        const geteld = l.itemsWerkelijk ?? l.items;
        return som + geteld.plastic + geteld.blik;
      }, 0);
    const ingeleverd = logs.filter((l) => isIngeleverd(l.status) && binnen(l.verwerktOp));
    const ingeleverdAltijd = logs.filter((l) => isIngeleverd(l.status));

    return {
      glasAantal: betaaldeOrders.length,
      glasOmzet: betaaldeOrders.reduce((som, o) => som + o.bedrag, 0),
      statiegeldAantal: opgehaaldeLogs.length,
      flesjes: opgehaaldeLogs.reduce((som, l) => som + (l.itemsWerkelijk?.plastic ?? 0), 0),
      blikjes: opgehaaldeLogs.reduce((som, l) => som + (l.itemsWerkelijk?.blik ?? 0), 0),
      uitbetaald: logs
        .filter((l) => !l.geschonken && binnen(l.tikkieVerstuurdOp))
        .reduce((som, l) => som + (l.tikkieBedrag ?? 0), 0),
      // Het potje van Jayce staat los van de omzet: dit is geld dat bekenden aan
      // hem hebben geschonken en dat binnen Buddy BV voor hem apart blijft.
      potje: logs
        .filter((l) => l.geschonken && binnen(l.tikkieVerstuurdOp))
        .reduce((som, l) => som + (l.tikkieBedrag ?? 0), 0),
      potjeTotaal: logs
        .filter((l) => l.geschonken)
        .reduce((som, l) => som + (l.tikkieBedrag ?? 0), 0),
      giften: logs.filter((l) => l.geschonken).length,
      viatimItems: telItems(ingeleverd),
      viatimVergoeding: viatimVergoeding(telItems(ingeleverd)),
      viatimVergoedingTotaal: viatimVergoeding(telItems(ingeleverdAltijd)),
      kostenOmzet: betaaldeKosten.reduce((som, l) => som + l.servicekosten, 0),
      kostenOpen: logs
        .filter((l) => l.servicekostenStatus === 'openstaand')
        .reduce((som, l) => som + l.servicekosten, 0),
    };
  }, [orders, logs, periode]);

  const totaleOmzet = cijfers.glasOmzet + cijfers.kostenOmzet;

  if ((glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0) {
    return (
      <AppLayout nav={ADMIN_NAV} title="Cijfers">
        <Loading />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={ADMIN_NAV} title="Cijfers">
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIODES.map((p) => (
          <button
            key={p.label}
            className={periode === p.dagen ? 'cmt-btn-primary !py-2 !text-sm' : 'cmt-btn-ghost !py-2 !text-sm'}
            onClick={() => setPeriode(p.dagen)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="cmt-card cmt-flow-glas cmt-card-flow mb-5">
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cmt-glas)' }}>
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-semibold">Omzet</span>
        </div>
        <p className="text-3xl font-bold">{formatCenten(totaleOmzet)}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
          {formatCenten(cijfers.glasOmzet)} uit glas en {formatCenten(cijfers.kostenOmzet)} uit
          ophaalkosten. Het statiegeld zelf zit hier niet bij, dat gaat volledig naar de klant.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Tegel
          flow="glas"
          icon={<Wine className="w-4 h-4" />}
          label="Glas opgehaald"
          waarde={String(cijfers.glasAantal)}
          toelichting="betaalde ophaalbeurten"
        />
        <Tegel
          flow="stat"
          icon={<Recycle className="w-4 h-4" />}
          label="Statiegeld opgehaald"
          waarde={String(cijfers.statiegeldAantal)}
          toelichting={`${cijfers.flesjes} flessen en ${cijfers.blikjes} blikjes`}
        />
        <Tegel
          flow="stat"
          icon={<Euro className="w-4 h-4" />}
          label="Uitbetaald via Tikkie"
          waarde={formatCenten(cijfers.uitbetaald)}
          toelichting="rechtstreeks naar de klanten"
        />
        <Tegel
          flow="stat"
          icon={<Euro className="w-4 h-4" />}
          label="Ophaalkosten open"
          waarde={formatCenten(cijfers.kostenOpen)}
          toelichting="nog niet betaald door klanten"
        />
      </div>

      <div className="cmt-card cmt-flow-stat cmt-card-tint mb-6">
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--cmt-stat)' }}>
          <PiggyBank className="w-5 h-5" />
          <span className="text-sm font-semibold">Wat Jayce verdient</span>
        </div>
        <p className="text-2xl font-bold">
          {formatCenten(cijfers.potjeTotaal + cijfers.viatimVergoedingTotaal)}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--cmt-ink-muted)' }}>
          Alles bij elkaar, sinds het begin. Dit staat los van de omzet en wordt binnen Buddy BV
          apart gehouden.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="cmt-card !p-4">
            <p className="text-lg font-bold">{formatCenten(cijfers.potjeTotaal)}</p>
            <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              geschonken door bekenden, waarvan {formatCenten(cijfers.potje)} in deze periode, uit{' '}
              {cijfers.giften} {cijfers.giften === 1 ? 'gift' : 'giften'}
            </p>
          </div>
          <div className="cmt-card !p-4">
            <p className="text-lg font-bold">{formatCenten(cijfers.viatimVergoedingTotaal)}</p>
            <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
              vergoeding van Viatim, {String(VIATIM_CENT_PER_ITEM).replace('.', ',')} cent per
              verpakking. In deze periode {formatCenten(cijfers.viatimVergoeding)} over{' '}
              {cijfers.viatimItems} ingeleverde stuks
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
        Wil je de ruwe gegevens? Op de pagina's Glas en Statiegeld staat een knop om alles als CSV
        te downloaden.
      </p>
    </AppLayout>
  );
};

export default Cijfers;
