// src/pages/admin/Klanten.tsx
//
// Klantenbeheer. Hier zet je iemand aan als bekende van Jayce. Een bekende mag
// buiten het werkgebied wonen en kan zijn statiegeld aan Jayce schenken.

import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, Search, Users } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useCustomerStore } from '../../store/customerStore';
import { useInstellingenStore, postcodeInGebied } from '../../store/instellingenStore';

const Klanten: React.FC = () => {
  const { customers, loading, error, loadAlleCustomers, zetBekende } = useCustomerStore();
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  const [zoek, setZoek] = useState('');
  const [bezigMet, setBezigMet] = useState<string | null>(null);

  useEffect(() => {
    loadAlleCustomers();
    loadWerkgebied();
  }, [loadAlleCustomers, loadWerkgebied]);

  const zichtbaar = useMemo(() => {
    const term = zoek.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.naam.toLowerCase().includes(term) ||
        c.adres.toLowerCase().includes(term) ||
        c.postcode.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );
  }, [customers, zoek]);

  const aantalBekenden = customers.filter((c) => c.isBekende).length;

  const wissel = async (id: string, nieuw: boolean) => {
    setBezigMet(id);
    try {
      await zetBekende(id, nieuw);
    } finally {
      setBezigMet(null);
    }
  };

  return (
    <AppLayout nav={ADMIN_NAV} title="Klanten">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[12rem]">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--cmt-ink-muted)' }}
          />
          <input
            className="cmt-input !pl-9"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op naam, adres of e-mail"
            aria-label="Klanten zoeken"
          />
        </div>
        <span className="text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          {customers.length} klanten, waarvan {aantalBekenden} bekend
        </span>
      </div>

      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      {loading && customers.length === 0 ? (
        <Loading />
      ) : zichtbaar.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Users className="w-6 h-6" />
          </span>
          <p>Geen klanten gevonden.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {zichtbaar.map((klant) => {
            const binnen = postcodeInGebied(klant.postcode, werkgebied);
            return (
              <li key={klant.id} className="cmt-card flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="flex-1 min-w-[13rem]">
                  <p className="font-semibold flex items-center gap-2">
                    {klant.naam}
                    {klant.isBekende && (
                      <span className="cmt-badge cmt-badge-stat">
                        <Heart className="w-3 h-3" /> Bekende
                      </span>
                    )}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                    {klant.adres}, {klant.postcode} {klant.plaats}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {klant.email}
                    {klant.telefoon && ` · ${klant.telefoon}`}
                  </p>

                  {!binnen && (
                    <p
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: klant.isBekende ? 'var(--cmt-ink-muted)' : 'var(--cmt-warning)' }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {klant.isBekende
                        ? 'Woont buiten het werkgebied, maar mag als bekende aanvragen doen'
                        : 'Woont buiten het werkgebied en kan dus niets aanvragen'}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!klant.isBekende}
                    disabled={bezigMet === klant.id}
                    onChange={(e) => wissel(klant.id, e.target.checked)}
                  />
                  Bekende van Jayce
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
};

export default Klanten;
