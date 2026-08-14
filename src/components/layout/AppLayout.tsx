// src/components/layout/AppLayout.tsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HelpCircle, LogOut } from 'lucide-react';
import Logo from '../shared/Logo';
import MobielMenu from './MobielMenu';
import NavTeller from './NavTeller';
import Rondleiding from '../uitleg/Rondleiding';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useMenuTellers, type TellerSleutel } from '../../hooks/useMenuTellers';
import { useRondleiding } from '../../hooks/useRondleiding';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  /** Kopje waaronder dit item in het mobiele menu komt te staan. */
  groep?: string;
  /** Welk bolletje hier hoort. De aantallen komen uit `useMenuTellers`. */
  teller?: TellerSleutel;
}

interface AppLayoutProps {
  children: React.ReactNode;
  /** Onderbalk op mobiel, zijbalk op desktop. Leeg = geen navigatie. */
  nav?: NavItem[];
  title?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, nav = [], title }) => {
  const { user } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const tellers = useMenuTellers();
  const rondleiding = useRondleiding();
  const heeftNav = nav.length > 0;
  // Vanaf een stuk of acht items past de balk met tekst en al niet meer op een
  // laptop. Dan tonen we alleen de iconen; de beheerder heeft er het meeste last
  // van en het meeste baat bij.
  const compacteNav = nav.length > 7;

  // Op de menuknop zelf alles wat om een handeling vraagt. Alleen de ronde telt
  // niet mee: die staat altijd vol en zou het bolletje altijd laten branden.
  const knopAantal = nav.reduce(
    (som, item) =>
      som + (item.teller && item.teller !== 'ronde' ? (tellers[item.teller] ?? 0) : 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cmt-paper)' }}>
      <header
        className="sticky top-0 z-40 safe-area-top"
        style={{ background: 'var(--cmt-surface)', borderBottom: '1px solid var(--cmt-border)' }}
      >
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" aria-label="Naar startpagina">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:inline text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
                {user.naam}
              </span>
            )}
            {rondleiding.stappen && (
              <button
                onClick={rondleiding.openen}
                className="cmt-btn-ghost !px-3 !py-2"
                title={rondleiding.titel}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Uitleg</span>
              </button>
            )}

            <button onClick={() => logout()} className="cmt-btn-ghost !px-3 !py-2" title="Uitloggen">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>

        {heeftNav && (
          <nav
            className="hidden md:block"
            style={{ borderTop: '1px solid var(--cmt-border)' }}
            aria-label="Hoofdnavigatie"
          >
            {/* Bij een lange balk, zoals die van de beheerder, staan alleen de
                iconen. De naam van de pagina komt tevoorschijn als je er met de
                muis op blijft staan, en bij de pagina waar je nu bent staat hij
                gewoon. Dat scheelt de helft aan breedte. */}
            <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto cmt-nav-schuif">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 transition-colors ${
                      isActive ? 'border-current' : 'border-transparent'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--cmt-glas)' : 'var(--cmt-ink-soft)',
                  })}
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      {item.icon}
                      {(!compacteNav || isActive) && item.label}
                      {item.teller && (
                        <NavTeller aantal={tellers[item.teller] ?? 0} soort={item.teller} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className={`flex-1 max-w-4xl w-full mx-auto px-4 py-6 ${heeftNav ? 'pb-24 md:pb-6' : ''}`}>
        {title && (
          <h1 className="text-2xl font-bold mb-5" style={{ color: 'var(--cmt-ink)' }}>
            {title}
          </h1>
        )}
        {children}
      </main>

      {heeftNav && <MobielMenu nav={nav} tellers={tellers} knopAantal={knopAantal} />}

      {rondleiding.open && rondleiding.stappen && (
        <Rondleiding
          stappen={rondleiding.stappen}
          titel={rondleiding.titel}
          onSluiten={rondleiding.sluiten}
        />
      )}
    </div>
  );
};

export default AppLayout;
