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
import { useOngelezen } from '../../hooks/useOngelezen';
import { useRondleiding } from '../../hooks/useRondleiding';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  /** Kopje waaronder dit item in het mobiele menu komt te staan. */
  groep?: string;
  /** Zet hier 'chat' om het aantal ongelezen berichten als bolletje te tonen. */
  teller?: 'chat';
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
  const ongelezen = useOngelezen();
  const rondleiding = useRondleiding();
  const heeftNav = nav.length > 0;

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
            {/* De beheerder heeft elf items; die passen niet naast elkaar op een
                laptop. Daarom mag de balk schuiven in plaats van over te lopen. */}
            <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto cmt-nav-schuif">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 transition-colors ${
                      isActive ? 'border-current' : 'border-transparent'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--cmt-glas)' : 'var(--cmt-ink-soft)',
                  })}
                >
                  {item.icon}
                  {item.label}
                  {item.teller === 'chat' && <NavTeller aantal={ongelezen} />}
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

      {heeftNav && <MobielMenu nav={nav} ongelezen={ongelezen} />}

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
