// src/pages/Installeren.tsx
//
// Uitleg hoe je de app op je beginscherm zet. Toont het herkende platform
// uitgeklapt bovenaan, en waar de browser het toestaat een echte installatieknop.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Download, Info, Share, Smartphone } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import CollapsibleSection from '../components/common/CollapsibleSection';
import { usePwaInstall, type Platform } from '../hooks/usePwaInstall';

interface Instructie {
  id: Platform;
  titel: string;
  stappen: React.ReactNode[];
  opmerking?: string;
}

const INSTRUCTIES: Instructie[] = [
  {
    id: 'ios',
    titel: 'iPhone en iPad',
    stappen: [
      <>Open deze pagina in <strong>Safari</strong>. In andere browsers werkt het niet.</>,
      <>
        Tik onderaan op het deel-icoon <Share className="inline w-4 h-4 mx-0.5" />, het
        vierkantje met het pijltje omhoog.
      </>,
      <>Scrol in het menu naar beneden en kies <strong>Zet op beginscherm</strong>.</>,
      <>Tik rechtsboven op <strong>Voeg toe</strong>. Klaar.</>,
    ],
    opmerking:
      'Apple staat installeren alleen toe via Safari. Gebruik je Chrome of Firefox op je iPhone, open deze pagina dan eerst in Safari.',
  },
  {
    id: 'android',
    titel: 'Android',
    stappen: [
      <>Open deze pagina in <strong>Chrome</strong>.</>,
      <>Tik rechtsboven op de drie puntjes.</>,
      <>
        Kies <strong>App installeren</strong> of <strong>Toevoegen aan startscherm</strong>.
        Welke van de twee er staat verschilt per toestel.
      </>,
      <>Bevestig met <strong>Installeren</strong>.</>,
    ],
    opmerking:
      'Vaak verschijnt de knop hierboven op deze pagina vanzelf. Dan hoef je het menu niet in.',
  },
  {
    id: 'windows',
    titel: 'Windows',
    stappen: [
      <>Open deze pagina in <strong>Chrome</strong> of <strong>Edge</strong>.</>,
      <>
        Klik rechts in de adresbalk op het installatie-icoon, een scherm met een pijltje
        naar beneden.
      </>,
      <>Klik op <strong>Installeren</strong>. De app krijgt een eigen venster en een snelkoppeling.</>,
    ],
  },
  {
    id: 'macos',
    titel: 'Mac',
    stappen: [
      <>
        In <strong>Chrome</strong> of <strong>Edge</strong>: klik op het installatie-icoon in
        de adresbalk.
      </>,
      <>
        In <strong>Safari</strong>: kies in de menubalk <strong>Archief</strong> en dan{' '}
        <strong>Voeg toe aan Dock</strong>. Dit werkt vanaf macOS Sonoma.
      </>,
    ],
  },
];

const PLATFORM_LABEL: Record<Platform, string> = {
  ios: 'iPhone of iPad',
  android: 'Android-telefoon',
  macos: 'Mac',
  windows: 'Windows-computer',
  overig: 'apparaat',
};

const Stappen: React.FC<{ instructie: Instructie }> = ({ instructie }) => (
  <>
    <div className="cmt-prose">
      <ol style={{ marginTop: 0 }}>
        {instructie.stappen.map((stap, i) => (
          <li key={i}>{stap}</li>
        ))}
      </ol>
    </div>
    {instructie.opmerking && (
      <p className="cmt-alert cmt-alert-info mt-4 text-sm">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>{instructie.opmerking}</span>
      </p>
    )}
  </>
);

const Installeren: React.FC = () => {
  const { kanInstalleren, isGeinstalleerd, bezig, installeer, platform, browser } =
    usePwaInstall();

  const eigen = INSTRUCTIES.find((i) => i.id === platform);
  const overige = INSTRUCTIES.filter((i) => i.id !== platform);
  const firefoxOpTelefoon = browser === 'firefox' && (platform === 'android' || platform === 'ios');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cmt-paper)' }}>
      <PublicHeader />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--cmt-ink-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Terug naar de site
          </Link>
        </div>

        <span
          className="flex items-center justify-center w-12 h-12 rounded-full mb-5"
          style={{ background: 'var(--cmt-glas-bg)', color: 'var(--cmt-glas)' }}
        >
          <Smartphone className="w-6 h-6" />
        </span>

        <h1 className="cmt-section-title mb-3">Zet de app op je beginscherm</h1>
        <p className="cmt-lead mb-8">
          Dan opent CashMetTrash als een gewone app, zonder adresbalk, en staat het icoon
          gewoon tussen je andere apps. Je hoeft niets uit een appwinkel te downloaden.
        </p>

        {isGeinstalleerd ? (
          <div className="cmt-card cmt-card-tint cmt-flow-glas">
            <CheckCircle className="w-8 h-8 mb-3" style={{ color: 'var(--cmt-glas)' }} />
            <h2 className="text-lg font-bold mb-1">Je hebt de app al geïnstalleerd</h2>
            <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
              Je gebruikt CashMetTrash nu als app. Er is verder niets te doen.
            </p>
          </div>
        ) : (
          <>
            {kanInstalleren && (
              <div className="cmt-card cmt-card-tint cmt-flow-glas mb-8">
                <h2 className="text-lg font-bold mb-1">Direct installeren</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--cmt-ink-soft)' }}>
                  Je browser kan de app meteen voor je installeren. Eén klik en het icoon
                  staat op je apparaat.
                </p>
                <button
                  className="cmt-btn-primary cmt-btn-lg"
                  onClick={installeer}
                  disabled={bezig}
                >
                  <Download className="w-4 h-4" />
                  {bezig ? 'Bezig...' : 'Installeer nu'}
                </button>
              </div>
            )}

            {eigen && (
              <section className="cmt-card mb-8">
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: 'var(--cmt-glas)' }}
                >
                  Voor jouw {PLATFORM_LABEL[platform]}
                </p>
                <h2 className="text-lg font-bold mb-4">{eigen.titel}</h2>
                <Stappen instructie={eigen} />
              </section>
            )}

            {firefoxOpTelefoon && (
              <div className="cmt-alert cmt-alert-warning mb-8">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>
                  Je gebruikt Firefox. Installeren werkt op de telefoon alleen in Safari
                  (iPhone) of Chrome (Android). Open deze pagina daar en probeer het opnieuw.
                </span>
              </div>
            )}

            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--cmt-ink)' }}>
              Andere apparaten
            </h2>
            <div className="space-y-3">
              {overige.map((instructie) => (
                <CollapsibleSection
                  key={instructie.id}
                  title={instructie.titel}
                  defaultOpen={false}
                >
                  <Stappen instructie={instructie} />
                </CollapsibleSection>
              ))}
            </div>
          </>
        )}

        <section className="mt-10">
          <h2 className="text-base font-bold mb-2">Wat levert het op?</h2>
          <div className="cmt-prose">
            <ul>
              <li>De app opent sneller en zonder adresbalk.</li>
              <li>Je blijft ingelogd, dus je hoeft je wachtwoord niet steeds in te typen.</li>
              <li>Het icoon staat tussen je andere apps, dus je vindt het makkelijk terug.</li>
              <li>Er wordt niets extra's opgeslagen, alleen de opmaak en het logo.</li>
            </ul>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Installeren;
