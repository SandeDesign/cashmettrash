// src/pages/moeder/Inscannen.tsx
//
// Mama scant het statiegeld in bij Viatim en zet de Tikkie hier klaar.
//
// De verdeling is met opzet zo: zij doet het inscannen en het overtypen, Marc
// drukt daarna alleen nog op versturen. Mama komt namelijk niet in de chat, en
// het bericht naar de klant hoort van de beheerder te komen.
//
// De inloggegevens van de Viatim-app staan hier bewust niet in. Wachtwoorden
// horen niet in deze app thuis; die krijgt ze los van Marc.

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AlertCircle, Check, Info, Recycle, ScanLine, Send } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { centenAlsInvoer, formatCenten, naarCenten } from '../../utils/constants';
import { isLink, normaliseerLink } from '../../utils/links';
import { stuurPushNaarRol } from '../../utils/push';
import type { StatiegeldLog } from '../../types';

const datum = (iso?: string) => (iso ? format(new Date(iso), 'd MMM', { locale: nl }) : '');

/** Eén melding invullen: het bedrag uit de automaat en de link uit Tikkie. */
const InscanKaart: React.FC<{
  log: StatiegeldLog;
  onKlaarzetten: (centen: number, link: string) => Promise<void>;
}> = ({ log, onKlaarzetten }) => {
  const [euro, setEuro] = useState('');
  const [link, setLink] = useState('');
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const geteld = log.itemsWerkelijk ?? log.items;
  const centen = naarCenten(euro);
  // Bij een schenking gaat het bedrag naar het potje van Jayce; dan is er geen
  // Tikkie nodig en hoeft er dus ook geen link te worden ingevuld.
  const schenking = !!log.geschonken;
  const linkGeldig = schenking || isLink(link);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();

    if (centen === null) {
      setFout('Vul het bedrag in zoals het in Viatim staat, bijvoorbeeld 2,85.');
      return;
    }
    if (!linkGeldig) {
      setFout('Dat lijkt geen webadres. Plak de link uit Tikkie, bijvoorbeeld tikkie.me/pay/iets.');
      return;
    }

    setFout(null);
    setBezig(true);
    try {
      await onKlaarzetten(centen, schenking ? '' : (normaliseerLink(link) ?? ''));
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Klaarzetten lukte niet');
      setBezig(false);
    }
  };

  return (
    <li className="cmt-card cmt-card-flow">
      <form onSubmit={verstuur}>
        <p className="font-bold">{log.customerNaam}</p>
        <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--cmt-ink-soft)' }}>
          <Recycle className="w-4 h-4" style={{ color: 'var(--cmt-stat)' }} />
          {geteld.plastic} flessen · {geteld.blik} blikjes
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
          Opgehaald op {datum(log.opgehaaldOp)}
          {log.servicekostenContant && ' · ophaalkosten gaan contant'}
        </p>

        {schenking && (
          <div className="cmt-alert cmt-alert-info mt-3">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>
              {log.customerNaam} schenkt dit aan Jayce. Vul alleen het bedrag in; er gaat geen
              Tikkie naar de klant.
            </span>
          </div>
        )}

        {fout && (
          <div className="cmt-alert cmt-alert-error mt-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{fout}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="cmt-label" htmlFor={`bedrag-${log.id}`}>
              Bedrag uit Viatim
            </label>
            <input
              id={`bedrag-${log.id}`}
              className="cmt-input"
              inputMode="decimal"
              placeholder="2,85"
              value={euro}
              onChange={(e) => setEuro(e.target.value)}
            />
          </div>

          {!schenking && (
            <div>
              <label className="cmt-label" htmlFor={`link-${log.id}`}>
                Link uit Tikkie
              </label>
              <input
                id={`link-${log.id}`}
                className="cmt-input"
                inputMode="url"
                placeholder="https://tikkie.me/pay/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="cmt-btn-primary cmt-btn-block mt-3"
          disabled={bezig || centen === null || !linkGeldig}
        >
          <Send className="w-4 h-4" />
          {bezig ? 'Bezig...' : 'Zet klaar voor Marc'}
        </button>
      </form>
    </li>
  );
};

const Inscannen: React.FC = () => {
  const { user } = useAuth();
  const { logs, loading, loadAlle, zetTikkieKlaar } = useStatiegeldStore();

  useEffect(() => {
    loadAlle();
  }, [loadAlle]);

  const teScannen = useMemo(
    () =>
      logs
        .filter((l) => l.status === 'opgehaald')
        .sort((a, b) => (a.opgehaaldOp ?? '').localeCompare(b.opgehaaldOp ?? '')),
    [logs]
  );

  const klaargezet = useMemo(
    () => logs.filter((l) => l.status === 'verwerktBijViatim'),
    [logs]
  );

  const zetKlaar = async (log: StatiegeldLog, centen: number, link: string) => {
    if (!user) return;
    await zetTikkieKlaar(log.id, centen, link, user.uid);
    void stuurPushNaarRol('admin', {
      titel: 'Tikkie staat klaar',
      tekst: `${log.customerNaam}: ${formatCenten(centen)} uit Viatim. Je hoeft hem alleen nog te versturen.`,
      url: '/admin/statiegeld',
    });
  };

  return (
    <AppLayout nav={MOEDER_NAV} title="Inscannen bij Viatim">
      <div className="cmt-flow-stat">
        <div className="cmt-card cmt-card-tint mb-5">
          <p className="font-bold flex items-center gap-2 mb-2">
            <ScanLine className="w-5 h-5" style={{ color: 'var(--cmt-stat)' }} />
            Zo werkt het
          </p>
          <ol className="text-sm space-y-1" style={{ color: 'var(--cmt-ink-soft)' }}>
            <li>1. Pak de zakken die Jayce heeft opgehaald.</li>
            <li>
              2. Log in de Viatim-app in en scan de flessen en blikjes in. Die inloggegevens krijg
              je van Marc; wachtwoorden zetten we bewust niet in deze app.
            </li>
            <li>3. Noteer het bedrag dat de automaat uitrekent.</li>
            <li>4. Maak in Tikkie een verzoek voor dat bedrag en kopieer de link.</li>
            <li>5. Vul beide hieronder in en zet het klaar.</li>
            <li>
              6. Marc stuurt het bericht naar de klant. Jij hoeft niets in de chat te doen, daar
              kom je ook niet.
            </li>
          </ol>
          <p className="text-xs mt-2" style={{ color: 'var(--cmt-ink-muted)' }}>
            Het bedrag komt uit de automaat en gaat volledig naar de klant. De ophaalkosten staan
            daar helemaal los van.
          </p>
        </div>

        {loading && logs.length === 0 && <Loading />}

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            Klaar om in te scannen
            {teScannen.length > 0 && (
              <span className="cmt-badge cmt-badge-stat">{teScannen.length}</span>
            )}
          </h2>

          {teScannen.length === 0 ? (
            <div className="cmt-card cmt-empty-state !py-6">
              <span className="cmt-empty-state-icon">
                <Check className="w-6 h-6" />
              </span>
              <p>Er ligt niets te wachten. Alles wat Jayce heeft opgehaald is ingescand.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {teScannen.map((log) => (
                <InscanKaart
                  key={log.id}
                  log={log}
                  onKlaarzetten={(centen, link) => zetKlaar(log, centen, link)}
                />
              ))}
            </ul>
          )}
        </section>

        {klaargezet.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Klaargezet voor Marc</h2>
            <ul className="space-y-2">
              {klaargezet.map((log) => (
                <li key={log.id} className="cmt-card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{log.customerNaam}</p>
                    <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                      {log.tikkieBedrag != null
                        ? `${centenAlsInvoer(log.tikkieBedrag)} euro uit Viatim`
                        : 'Nog geen bedrag'}
                      {' · '}
                      wacht op versturen
                    </p>
                  </div>
                  <span className="cmt-badge cmt-badge-neutral">Bij Marc</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Inscannen;
