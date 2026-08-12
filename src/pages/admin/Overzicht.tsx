// src/pages/admin/Overzicht.tsx
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Euro, Recycle, Send, Wine } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { formatCenten } from '../../utils/constants';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

const AdminOverzicht: React.FC = () => {
  const { orders, loading: glasLaadt, loadAlle: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadAlle: loadStatiegeld } = useStatiegeldStore();

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
  }, [loadGlas, loadStatiegeld]);

  const cijfers = useMemo(() => {
    const grens = Date.now() - WEEK_MS;
    const dezeWeek = orders.filter((o) => new Date(o.aangemaaktOp).getTime() >= grens);
    const betaaldDezeWeek = dezeWeek.filter((o) => o.status === 'betaald' || o.status === 'opgehaald');

    return {
      glasAantal: betaaldDezeWeek.length,
      glasOmzet: betaaldDezeWeek.reduce((som, o) => som + o.bedrag, 0),
      glasOpenstaand: orders.filter((o) => o.status === 'betaald' || o.status === 'ingepland').length,
      teVerwerken: logs.filter((l) => l.status === 'opgehaald').length,
      openTikkies: logs.filter((l) => l.status === 'verwerktBijViatim').length,
    };
  }, [orders, logs]);

  if ((glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0) {
    return (
      <AppLayout nav={ADMIN_NAV} title="Overzicht">
        <Loading />
      </AppLayout>
    );
  }

  return (
    <AppLayout nav={ADMIN_NAV} title="Overzicht">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        Afgelopen 7 dagen
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Tegel
          flow="glas"
          icon={<Wine className="w-4 h-4" />}
          label="Glas opgehaald"
          waarde={String(cijfers.glasAantal)}
          toelichting="betaalde ophaalbeurten deze week"
        />
        <Tegel
          flow="glas"
          icon={<Euro className="w-4 h-4" />}
          label="Omzet glas"
          waarde={formatCenten(cijfers.glasOmzet)}
          toelichting="naar de bedrijfsrekening"
        />
        <Tegel
          flow="glas"
          icon={<Wine className="w-4 h-4" />}
          label="Nog op te halen"
          waarde={String(cijfers.glasOpenstaand)}
          toelichting="betaald, staat klaar voor Jayce"
        />
        <Tegel
          flow="stat"
          icon={<Recycle className="w-4 h-4" />}
          label="Bij Jayce"
          waarde={String(cijfers.teVerwerken)}
          toelichting="opgehaald, nog in te scannen bij Viatim"
        />
        <Tegel
          flow="stat"
          icon={<Send className="w-4 h-4" />}
          label="Tikkie te sturen"
          waarde={String(cijfers.openTikkies)}
          toelichting="verwerkt bij Viatim, klant wacht nog"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/glas" className="cmt-btn-secondary">
          <Wine className="w-4 h-4" /> Glas-orders
        </Link>
        <Link to="/admin/statiegeld" className="cmt-flow-stat cmt-btn-secondary">
          <Recycle className="w-4 h-4" /> Statiegeld-log
        </Link>
      </div>
    </AppLayout>
  );
};

export default AdminOverzicht;
