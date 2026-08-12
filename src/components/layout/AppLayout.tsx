// src/components/layout/AppLayout.tsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from '../shared/Logo';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  /** Laat dit item weg uit de mobiele onderbalk; daar passen er hooguit vijf. */
  alleenDesktop?: boolean;
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
  const heeftNav = nav.length > 0;
  const mobielNav = nav.filter((item) => !item.alleenDesktop);

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
            <div className="max-w-4xl mx-auto px-4 flex gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                      isActive ? 'border-current' : 'border-transparent'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--cmt-glas)' : 'var(--cmt-ink-soft)',
                  })}
                >
                  {item.icon}
                  {item.label}
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

      {mobielNav.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-area-bottom"
          style={{ background: 'var(--cmt-surface)', borderTop: '1px solid var(--cmt-border)' }}
          aria-label="Hoofdnavigatie"
        >
          <div className="flex">
            {mobielNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
                style={({ isActive }) => ({
                  color: isActive ? 'var(--cmt-glas)' : 'var(--cmt-ink-muted)',
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default AppLayout;
