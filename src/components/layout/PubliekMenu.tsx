// src/components/layout/PubliekMenu.tsx
//
// Het menu rechtsboven op de publieke pagina's. Eén knop in plaats van losse
// knoppen voor inloggen en aanmelden, want de juridische pagina's en de
// installatie-uitleg pasten daar toch niet meer naast.

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Cookie,
  FileText,
  LogIn,
  Menu,
  Recycle,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  /** Interne route, of een anker op de landingspagina. */
  naar: string;
  uitleg?: string;
  /** Springt naar een anker in plaats van naar een andere pagina. */
  anker?: boolean;
}

const GROEPEN: { naam: string; items: MenuItem[] }[] = [
  {
    naam: 'Aan de slag',
    items: [
      {
        label: 'Aanmelden',
        icon: <UserPlus className="w-5 h-5" />,
        naar: '/registreren',
        uitleg: 'Maak een gratis account',
      },
      {
        label: 'Inloggen',
        icon: <LogIn className="w-5 h-5" />,
        naar: '/login',
        uitleg: 'Ik heb er al een',
      },
      {
        label: 'Hoe het werkt',
        icon: <Sparkles className="w-5 h-5" />,
        naar: '/#hoe-het-werkt',
        uitleg: 'In drie stappen',
        anker: true,
      },
      {
        label: 'App installeren',
        icon: <Smartphone className="w-5 h-5" />,
        naar: '/installeren',
        uitleg: 'Op je telefoon zetten',
      },
      {
        label: 'Je statiegeld',
        icon: <Recycle className="w-5 h-5" />,
        naar: '/statiegeld-verwerking',
        uitleg: 'Hoe het wordt verwerkt',
      },
    ],
  },
  {
    naam: 'Goed om te weten',
    items: [
      { label: 'Voorwaarden', icon: <ScrollText className="w-5 h-5" />, naar: '/voorwaarden' },
      { label: 'Privacy', icon: <ShieldCheck className="w-5 h-5" />, naar: '/privacy' },
      { label: 'Cookies', icon: <Cookie className="w-5 h-5" />, naar: '/cookies' },
      { label: 'Herroeping', icon: <RotateCcw className="w-5 h-5" />, naar: '/herroeping' },
      { label: 'Disclaimer', icon: <FileText className="w-5 h-5" />, naar: '/disclaimer' },
    ],
  },
];

const PubliekMenu: React.FC = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', opToets);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', opToets);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={open ? 'cmt-btn-primary !px-3' : 'cmt-btn-secondary !px-3'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        <span className="hidden xs:inline">Menu</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 cmt-menu-waas" onClick={() => setOpen(false)} />

          <div
            className="cmt-publiek-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={(e) => e.stopPropagation()}
          >
            {GROEPEN.map((groep) => (
              <section key={groep.naam} className="mb-4 last:mb-0">
                <p className="cmt-publiek-menu-kop">{groep.naam}</p>
                <div className="grid gap-1.5">
                  {groep.items.map((item, i) =>
                    item.anker ? (
                      <a
                        key={item.label}
                        href={item.naar}
                        className="cmt-publiek-menu-item cmt-animate-in"
                        style={{ animationDelay: `${i * 25}ms` }}
                        onClick={() => setOpen(false)}
                      >
                        <span className="cmt-menu-tegel-icoon">{item.icon}</span>
                        <span>
                          <span className="block font-semibold text-sm">{item.label}</span>
                          {item.uitleg && (
                            <span
                              className="block text-xs"
                              style={{ color: 'var(--cmt-ink-muted)' }}
                            >
                              {item.uitleg}
                            </span>
                          )}
                        </span>
                      </a>
                    ) : (
                      <Link
                        key={item.label}
                        to={item.naar}
                        className="cmt-publiek-menu-item cmt-animate-in"
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <span className="cmt-menu-tegel-icoon">{item.icon}</span>
                        <span>
                          <span className="block font-semibold text-sm">{item.label}</span>
                          {item.uitleg && (
                            <span
                              className="block text-xs"
                              style={{ color: 'var(--cmt-ink-muted)' }}
                            >
                              {item.uitleg}
                            </span>
                          )}
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default PubliekMenu;
