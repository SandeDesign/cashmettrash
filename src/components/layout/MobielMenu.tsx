// src/components/layout/MobielMenu.tsx
//
// Het menu op de telefoon. In plaats van een rij knopjes onderin staat er één
// ronde knop rechtsonder; die opent een paneel met de pagina's in groepjes.
// Alleen het groepje waar je nu in zit staat open, de rest klap je zelf uit.

import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { NavItem } from './AppLayout';

interface MobielMenuProps {
  nav: NavItem[];
}

/** Hoort dit item bij het pad waar je nu bent? */
function isActief(item: NavItem, pad: string): boolean {
  return item.end ? pad === item.to : pad === item.to || pad.startsWith(`${item.to}/`);
}

const MobielMenu: React.FC<MobielMenuProps> = ({ nav }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [uitgeklapt, setUitgeklapt] = useState<string | null>(null);

  // In volgorde van voorkomen, zodat de groepjes staan zoals ze bedoeld zijn.
  const groepen = useMemo(() => {
    const volgorde: string[] = [];
    const inhoud = new Map<string, NavItem[]>();

    for (const item of nav) {
      const naam = item.groep ?? 'Menu';
      if (!inhoud.has(naam)) {
        inhoud.set(naam, []);
        volgorde.push(naam);
      }
      inhoud.get(naam)!.push(item);
    }

    return volgorde.map((naam) => ({ naam, items: inhoud.get(naam)! }));
  }, [nav]);

  const huidigeGroep = useMemo(() => {
    const treffer = groepen.find((g) => g.items.some((item) => isActief(item, pathname)));
    return treffer?.naam ?? groepen[0]?.naam ?? null;
  }, [groepen, pathname]);

  // Bij het openen begin je in het groepje waar je nu bent.
  useEffect(() => {
    if (open) setUitgeklapt(huidigeGroep);
  }, [open, huidigeGroep]);

  // Van pagina wisselen sluit het menu, en achter het paneel mag je niet scrollen.
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

  const actief = nav.find((item) => isActief(item, pathname));

  return (
    <div className="md:hidden">
      {open && (
        <div
          className="fixed inset-0 z-40 cmt-menu-waas"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <div
          className="fixed z-50 inset-x-3 bottom-24 cmt-menu-paneel safe-area-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold">Waar wil je heen?</p>
            <button
              className="cmt-menu-sluit"
              onClick={() => setOpen(false)}
              aria-label="Menu sluiten"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            {groepen.map((groep) => {
              const isUit = uitgeklapt === groep.naam;
              return (
                <section key={groep.naam} className="cmt-menu-groep">
                  <button
                    type="button"
                    className="cmt-menu-kop"
                    aria-expanded={isUit}
                    onClick={() => setUitgeklapt(isUit ? null : groep.naam)}
                  >
                    <span>{groep.naam}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isUit ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isUit && (
                    <div className="grid grid-cols-2 gap-2 p-2 pt-0">
                      {groep.items.map((item, i) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `cmt-menu-tegel cmt-animate-in ${isActive ? 'is-actief' : ''}`
                          }
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <span className="cmt-menu-tegel-icoon">{item.icon}</span>
                          <span className="text-sm font-semibold">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`cmt-menu-knop safe-area-bottom ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        {!open && actief && <span className="cmt-menu-knop-label">{actief.label}</span>}
      </button>
    </div>
  );
};

export default MobielMenu;
