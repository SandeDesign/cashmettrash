// src/components/layout/JuridischeLayout.tsx
//
// Leeskolom voor de juridische pagina's: dezelfde header en footer als de
// landingspagina, maar met smallere regels zodat lopende tekst prettig leest.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import {
  BEDRIJF,
  bedrijfsgegevensOnvolledig,
  ontbrekendeBedrijfsgegevens,
} from '../../utils/bedrijf';

interface JuridischeLayoutProps {
  titel: string;
  inleiding?: string;
  children: React.ReactNode;
}

const JuridischeLayout: React.FC<JuridischeLayoutProps> = ({ titel, inleiding, children }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--cmt-paper)' }}>
    <PublicHeader />

    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: 'var(--cmt-ink-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Terug naar de site
      </Link>

      <h1 className="cmt-section-title mb-3">{titel}</h1>

      {inleiding && (
        <p className="cmt-lead mb-8">{inleiding}</p>
      )}

      {bedrijfsgegevensOnvolledig() && (
        <div className="cmt-alert cmt-alert-warning mb-8">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            Deze pagina is nog niet compleet. Vul het {ontbrekendeBedrijfsgegevens().join(', ')}{' '}
            aan in <code className="mx-1">src/utils/bedrijf.ts</code>. Zie SETUP.md.
          </span>
        </div>
      )}

      <div className="cmt-prose">{children}</div>

      <p className="mt-12 pt-6 text-xs" style={{ borderTop: '1px solid var(--cmt-border)', color: 'var(--cmt-ink-muted)' }}>
        Laatst bijgewerkt op {BEDRIJF.laatstBijgewerkt}.
      </p>
    </main>

    <PublicFooter />
  </div>
);

export default JuridischeLayout;
