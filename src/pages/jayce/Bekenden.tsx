// src/pages/jayce/Bekenden.tsx
//
// De mensen die dicht bij Jayce staan. Zij mogen hun statiegeld aan hem geven.
// Taal is voor een tienjarige, en er staan geen bedragen op.

import React, { useEffect, useMemo } from 'react';
import { Gift, Heart } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { JAYCE_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useCustomerStore } from '../../store/customerStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import AdresKaart from '../../components/kaart/AdresKaart';
import type { Punt } from '../../utils/geo';

const Bekenden: React.FC = () => {
  const { customers, loading, loadAlleCustomers } = useCustomerStore();
  const { logs, loadAlle } = useStatiegeldStore();
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  useEffect(() => {
    loadAlleCustomers();
    loadAlle();
    loadWerkgebied();
  }, [loadAlleCustomers, loadAlle, loadWerkgebied]);

  const thuis = useMemo<Punt>(
    () => ({ lat: werkgebied.middelpuntLat, lon: werkgebied.middelpuntLon }),
    [werkgebied.middelpuntLat, werkgebied.middelpuntLon]
  );

  const bekenden = useMemo(() => customers.filter((c) => c.isBekende), [customers]);

  /** Hoe vaak iemand zijn statiegeld aan Jayce heeft gegeven. */
  const cadeautjes = useMemo(() => {
    const per = new Map<string, number>();
    for (const log of logs) {
      if (log.geschonken) per.set(log.customerId, (per.get(log.customerId) ?? 0) + 1);
    }
    return per;
  }, [logs]);

  return (
    <AppLayout nav={JAYCE_NAV} title="Mijn bekenden">
      <p className="text-base mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
        Dit zijn mensen die je goed kent. Zij mogen hun flesjes aan jou geven in plaats van het
        geld zelf te houden.
      </p>

      {loading && customers.length === 0 ? (
        <Loading text="Momentje..." />
      ) : bekenden.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Heart className="w-6 h-6" />
          </span>
          <p className="font-bold" style={{ color: 'var(--cmt-ink)' }}>
            Nog geen bekenden
          </p>
          <p className="text-base mt-1">Papa zet hier de mensen neer die je goed kent.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {bekenden.map((bekende) => {
            const aantal = cadeautjes.get(bekende.id) ?? 0;
            return (
              <li key={bekende.id} className="cmt-flow-stat cmt-card cmt-card-flow">
                <div className="flex items-start gap-3">
                  <span
                    className="flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0"
                    style={{ background: 'var(--cmt-stat-bg)', color: 'var(--cmt-stat)' }}
                  >
                    <Heart className="w-5 h-5" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold">{bekende.naam}</p>
                    <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                      {bekende.adres}
                      <br />
                      {bekende.postcode} {bekende.plaats}
                    </p>

                    {aantal > 0 && (
                      <p
                        className="text-sm mt-2 flex items-center gap-1.5 font-semibold"
                        style={{ color: 'var(--cmt-stat)' }}
                      >
                        <Gift className="w-4 h-4" />
                        {aantal === 1
                          ? 'Heeft je al een keer flesjes gegeven'
                          : `Heeft je al ${aantal} keer flesjes gegeven`}
                      </p>
                    )}
                  </div>
                </div>

                <AdresKaart
                  adres={bekende.adres}
                  postcode={bekende.postcode}
                  plaats={bekende.plaats}
                  punt={
                    bekende.lat != null && bekende.lon != null
                      ? { lat: bekende.lat, lon: bekende.lon }
                      : null
                  }
                  thuis={thuis}
                />
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
};

export default Bekenden;
