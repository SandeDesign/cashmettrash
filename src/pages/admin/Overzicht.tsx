// src/pages/admin/Overzicht.tsx
//
// Dit is een takenlijst, geen cijferoverzicht. De vraag die deze pagina moet
// beantwoorden is "wat moet ik nu doen", niet "hoe gaat het". De cijfers staan
// op /admin/cijfers.

import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle,
  Clock,
  MessageSquare,
  Wallet,
  Wine,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import MeldingenKaart from '../../components/common/MeldingenKaart';
import { useAuth } from '../../hooks/useAuth';
import { useGlasStore } from '../../store/glasStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useChatStore } from '../../store/chatStore';
import { formatCenten } from '../../utils/constants';

/** Een aanvraag die na een dag nog niet betaald is, is waarschijnlijk blijven hangen. */
const VERLOPEN_NA_MS = 24 * 60 * 60 * 1000;

interface Taak {
  id: string;
  icon: React.ReactNode;
  flow: 'glas' | 'stat';
  titel: string;
  uitleg: string;
  aantal: number;
  naar: string;
  knop: string;
  /** Dringend zet de kaart in de aandachtkleur. */
  dringend?: boolean;
}

const TaakKaart: React.FC<{ taak: Taak }> = ({ taak }) => (
  <li className={`cmt-flow-${taak.flow} cmt-card cmt-card-flow cmt-animate-in`}>
    <div className="flex items-start gap-3">
      <span
        className="flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0"
        style={{ background: 'var(--cmt-accent-bg)', color: 'var(--cmt-accent)' }}
      >
        {taak.icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold">{taak.titel}</h3>
          <span className={`cmt-badge ${taak.dringend ? 'cmt-badge-warning' : 'cmt-badge-neutral'}`}>
            {taak.aantal}
          </span>
        </div>
        <p className="text-sm mt-0.5" style={{ color: 'var(--cmt-ink-soft)' }}>
          {taak.uitleg}
        </p>
      </div>
    </div>

    <Link to={taak.naar} className="cmt-btn-primary cmt-btn-block mt-4 sm:!w-auto sm:!inline-flex">
      {taak.knop} <ArrowRight className="w-4 h-4" />
    </Link>
  </li>
);

const AdminOverzicht: React.FC = () => {
  const { user } = useAuth();
  const { orders, loading: glasLaadt, loadAlle: loadGlas } = useGlasStore();
  const { logs, loading: statLaadt, loadAlle: loadStatiegeld } = useStatiegeldStore();
  const { gesprekken, volgGesprekken } = useChatStore();

  useEffect(() => {
    loadGlas();
    loadStatiegeld();
    return volgGesprekken();
  }, [loadGlas, loadStatiegeld, volgGesprekken]);

  const taken = useMemo<Taak[]>(() => {
    const lijst: Taak[] = [];

    const afTeRekenen = logs.filter(
      (l) => l.status === 'opgehaald' || l.status === 'verwerktBijViatim'
    ).length;
    if (afTeRekenen > 0) {
      lijst.push({
        id: 'afrekenen',
        icon: <Wallet className="w-5 h-5" />,
        flow: 'stat',
        titel: 'Statiegeld afrekenen',
        uitleg: 'Jayce heeft dit opgehaald. Scan in bij Viatim en deel de Tikkie.',
        aantal: afTeRekenen,
        naar: '/admin/statiegeld',
        knop: 'Afrekenen',
        dringend: true,
      });
    }

    const ongelezen = gesprekken.reduce((som, g) => som + (g.ongelezenAdmin || 0), 0);
    if (ongelezen > 0) {
      lijst.push({
        id: 'chat',
        icon: <MessageSquare className="w-5 h-5" />,
        flow: 'stat',
        titel: 'Berichten beantwoorden',
        uitleg: 'Er wachten klanten op een antwoord.',
        aantal: ongelezen,
        naar: '/admin/berichten',
        knop: 'Naar de berichten',
        dringend: true,
      });
    }

    const openKosten = logs.filter((l) => l.servicekostenStatus === 'openstaand');
    if (openKosten.length > 0) {
      const bedrag = openKosten.reduce((som, l) => som + l.servicekosten, 0);
      lijst.push({
        id: 'ophaalkosten',
        icon: <Clock className="w-5 h-5" />,
        flow: 'stat',
        titel: 'Ophaalkosten staan open',
        uitleg: `Samen ${formatCenten(bedrag)}. Een herinnering in de chat helpt vaak.`,
        aantal: openKosten.length,
        naar: '/admin/statiegeld',
        knop: 'Bekijken',
      });
    }

    const blijvenHangen = orders.filter(
      (o) =>
        o.status === 'aangemeld' &&
        // Wie contant betaalt is niet afgehaakt; die wacht gewoon op Jayce.
        !o.contant &&
        Date.now() - new Date(o.aangemaaktOp).getTime() > VERLOPEN_NA_MS
    ).length;
    if (blijvenHangen > 0) {
      lijst.push({
        id: 'onbetaald',
        icon: <Wine className="w-5 h-5" />,
        flow: 'glas',
        titel: 'Aanvragen zonder betaling',
        uitleg: 'Deze klanten zijn onderweg afgehaakt bij het betalen.',
        aantal: blijvenHangen,
        naar: '/admin/glas',
        knop: 'Bekijken',
      });
    }

    // Twee aparte regels, want het is echt iets anders: bij de eerste moet Jayce
    // nog zeggen wanneer hij komt, bij de tweede weet de klant dat al.
    const teBevestigen =
      orders.filter((o) => o.status === 'betaald' || (o.status === 'aangemeld' && o.contant))
        .length +
      logs.filter((l) => l.status === 'aangemeld').length;
    if (teBevestigen > 0) {
      lijst.push({
        id: 'bevestigen',
        icon: <Clock className="w-5 h-5" />,
        flow: 'stat',
        titel: 'Wacht op Jayce',
        uitleg: 'Hij moet nog bevestigen wanneer hij langskomt.',
        aantal: teBevestigen,
        naar: '/admin/ophalen',
        knop: 'Naar de ophaalronde',
      });
    }

    const staatGepland =
      orders.filter((o) => o.status === 'ingepland').length +
      logs.filter((l) => l.status === 'ingepland').length;
    if (staatGepland > 0) {
      lijst.push({
        id: 'ingepland',
        icon: <CalendarClock className="w-5 h-5" />,
        flow: 'glas',
        titel: 'Ingepland door Jayce',
        uitleg: 'De klant weet wanneer hij komt. Hier hoef jij niets voor te doen.',
        aantal: staatGepland,
        naar: '/admin/ophalen',
        knop: 'Naar de ophaalronde',
      });
    }

    return lijst;
  }, [orders, logs, gesprekken]);

  const laadt = (glasLaadt || statLaadt) && orders.length === 0 && logs.length === 0;
  const werkTeDoen = taken.filter((t) => t.dringend).length;

  return (
    <AppLayout nav={ADMIN_NAV} title="Te doen">
      {laadt ? (
        <Loading />
      ) : taken.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <CheckCircle className="w-6 h-6" />
          </span>
          <p className="font-semibold" style={{ color: 'var(--cmt-ink)' }}>
            Niets te doen
          </p>
          <p className="text-sm mt-1">Alles is afgehandeld. Mooi moment voor koffie.</p>
        </div>
      ) : (
        <>
          <p className="-mt-2 mb-5 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
            {werkTeDoen === 0
              ? 'Niets dringends. Hieronder loopt alles zoals het hoort.'
              : `${werkTeDoen === 1 ? 'Eén ding' : `${werkTeDoen} dingen`} vragen om actie.`}
          </p>

          <ul className="space-y-3">
            {taken.map((taak) => (
              <TaakKaart key={taak.id} taak={taak} />
            ))}
          </ul>
        </>
      )}

      <MeldingenKaart uid={user?.uid} rol={user?.rol} />
    </AppLayout>
  );
};

export default AdminOverzicht;
