// src/pages/admin/Klanten.tsx
//
// Mensenbeheer. Hier bepaal je twee dingen: welke rol iemand heeft, en of een
// klant een bekende van Jayce is. Een bekende mag buiten het werkgebied wonen
// en kan zijn statiegeld aan Jayce schenken.

import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, MapPinOff, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerStore, ververCoordinaten } from '../../store/customerStore';
import { useGebruikersStore } from '../../store/gebruikersStore';
import { useInstellingenStore } from '../../store/instellingenStore';
import { toetsWerkgebied } from '../../utils/werkgebied';
import { routeplannerBeschikbaar } from '../../utils/geo';
import type { Customer, Rol } from '../../types';

const ROLLEN: { waarde: Rol; label: string; uitleg: string }[] = [
  { waarde: 'klant', label: 'Klant', uitleg: 'Vraagt op en betaalt' },
  { waarde: 'jayce', label: 'Jayce', uitleg: 'Haalt op en telt' },
  { waarde: 'moeder', label: 'Moeder', uitleg: 'Kijkt mee en rijdt mee' },
  { waarde: 'admin', label: 'Beheerder', uitleg: 'Regelt alles' },
];

const ROL_KLASSE: Record<Rol, string> = {
  klant: 'cmt-badge-neutral',
  jayce: 'cmt-badge-glas',
  moeder: 'cmt-badge-stat',
  admin: 'cmt-badge-warning',
};

const Klanten: React.FC = () => {
  const { user } = useAuth();
  const { customers, loadAlleCustomers, zetBekende } = useCustomerStore();
  const { gebruikers, loading, error, loadAlleGebruikers, zetRol } = useGebruikersStore();
  const { werkgebied, loadWerkgebied } = useInstellingenStore();

  const [zoek, setZoek] = useState('');
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [kaartBezig, setKaartBezig] = useState(false);
  const [kaartMelding, setKaartMelding] = useState<string | null>(null);

  useEffect(() => {
    loadAlleGebruikers();
    loadAlleCustomers();
    loadWerkgebied();
  }, [loadAlleGebruikers, loadAlleCustomers, loadWerkgebied]);

  /** Account en klantgegevens horen bij elkaar: allebei op de uid. */
  const mensen = useMemo(() => {
    const perId = new Map<string, Customer>(customers.map((c) => [c.id, c]));
    return gebruikers.map((g) => ({ account: g, klant: perId.get(g.uid) ?? null }));
  }, [gebruikers, customers]);

  const zichtbaar = useMemo(() => {
    const term = zoek.trim().toLowerCase();
    if (!term) return mensen;
    return mensen.filter(({ account, klant }) =>
      [account.naam, account.email, klant?.adres, klant?.postcode]
        .filter(Boolean)
        .some((veld) => veld!.toLowerCase().includes(term))
    );
  }, [mensen, zoek]);

  const aantalBekenden = customers.filter((c) => c.isBekende).length;
  const zonderCoordinaten = customers.filter((c) => c.lat == null || c.lon == null);

  /**
   * Zoekt de ontbrekende adressen op en bewaart de coordinaten. Zonder die
   * coordinaten kan Jayce het adres niet op de kaart zien en staat het niet in
   * zijn route. Normaal gebeurt dit vanzelf zodra de klant een aanvraagpagina
   * opent, maar dan moet hij daar wel geweest zijn.
   */
  const zoekAdressenOp = async () => {
    setKaartBezig(true);
    setKaartMelding(null);

    let gelukt = 0;
    for (const klant of zonderCoordinaten) {
      const ok = await ververCoordinaten(klant.id, klant.adres, klant.postcode, klant.plaats);
      if (ok) gelukt += 1;
    }

    await loadAlleCustomers();
    setKaartBezig(false);
    setKaartMelding(
      gelukt === zonderCoordinaten.length
        ? `${gelukt} ${gelukt === 1 ? 'adres' : 'adressen'} op de kaart gezet.`
        : `${gelukt} van de ${zonderCoordinaten.length} adressen gevonden. De rest herkent de kaartdienst niet; controleer of die adressen kloppen.`
    );
  };

  const wisselBekende = async (id: string, nieuw: boolean) => {
    setBezigMet(id);
    try {
      await zetBekende(id, nieuw);
    } finally {
      setBezigMet(null);
    }
  };

  const wisselRol = async (uid: string, rol: Rol) => {
    setBezigMet(uid);
    try {
      await zetRol(uid, rol);
    } finally {
      setBezigMet(null);
    }
  };

  return (
    <AppLayout nav={ADMIN_NAV} title="Mensen">
      <p className="cmt-lead mb-5">
        Geef hier iemand een rol, of vink een klant aan als bekende van Jayce. Wie je van rol
        verandert moet zelf even uit- en opnieuw inloggen.
      </p>

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
            aria-label="Mensen zoeken"
          />
        </div>
        <span className="text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
          {gebruikers.length} accounts, waarvan {aantalBekenden} bekend
        </span>
      </div>

      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      {kaartMelding && <div className="cmt-alert cmt-alert-info mb-4">{kaartMelding}</div>}

      {zonderCoordinaten.length > 0 && (
        <div className="cmt-alert cmt-alert-warning mb-4">
          <MapPinOff className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">
            Van {zonderCoordinaten.length}{' '}
            {zonderCoordinaten.length === 1 ? 'adres weten' : 'adressen weten'} we nog niet waar
            het ligt. Jayce ziet die dan niet op de kaart en niet in zijn route.
            {!routeplannerBeschikbaar && ' Er is nog geen kaartsleutel ingesteld.'}
          </span>
          {routeplannerBeschikbaar && (
            <button
              className="cmt-btn-secondary !py-2 !text-sm flex-shrink-0"
              onClick={zoekAdressenOp}
              disabled={kaartBezig}
            >
              <RefreshCw className="w-4 h-4" />
              {kaartBezig ? 'Bezig...' : 'Zoek ze op'}
            </button>
          )}
        </div>
      )}

      {loading && gebruikers.length === 0 ? (
        <Loading />
      ) : zichtbaar.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Users className="w-6 h-6" />
          </span>
          <p>Niemand gevonden.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {zichtbaar.map(({ account, klant }) => {
            // Voor de beheerder tellen we de bekende-vlag even niet mee, anders
            // zie je nooit meer dat iemand eigenlijk buiten het gebied woont.
            const oordeel = klant
              ? toetsWerkgebied({ ...klant, isBekende: false }, werkgebied)
              : null;
            const binnen = !oordeel || oordeel.mag;
            const isIkzelf = account.uid === user?.uid;
            const bezig = bezigMet === account.uid;

            return (
              <li key={account.uid} className="cmt-card">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                  <div className="flex-1 min-w-[13rem]">
                    <p className="font-semibold flex flex-wrap items-center gap-2">
                      {account.naam}
                      <span className={`cmt-badge ${ROL_KLASSE[account.rol]}`}>
                        {ROLLEN.find((r) => r.waarde === account.rol)?.label ?? account.rol}
                      </span>
                      {klant?.isBekende && (
                        <span className="cmt-badge cmt-badge-stat">
                          <Heart className="w-3 h-3" /> Bekende
                        </span>
                      )}
                      {isIkzelf && (
                        <span className="cmt-badge cmt-badge-neutral">
                          <ShieldCheck className="w-3 h-3" /> Jij
                        </span>
                      )}
                    </p>

                    {klant && (
                      <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
                        {klant.adres}, {klant.postcode} {klant.plaats}
                      </p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                      {account.email}
                      {klant?.telefoon && ` · ${klant.telefoon}`}
                    </p>

                    {klant && (klant.lat == null || klant.lon == null) && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1"
                        style={{ color: 'var(--cmt-warning)' }}
                      >
                        <MapPinOff className="w-3.5 h-3.5" />
                        Staat nog niet op de kaart
                      </p>
                    )}

                    {klant && !binnen && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1"
                        style={{
                          color: klant.isBekende ? 'var(--cmt-ink-muted)' : 'var(--cmt-warning)',
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {klant.isBekende
                          ? 'Woont buiten het werkgebied, maar mag als bekende aanvragen doen'
                          : 'Woont buiten het werkgebied en kan dus niets aanvragen'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[11rem]">
                    <label className="text-xs font-semibold" htmlFor={`rol-${account.uid}`}>
                      Rol
                    </label>
                    <select
                      id={`rol-${account.uid}`}
                      className="cmt-select !py-2 !text-sm"
                      value={account.rol}
                      disabled={bezig || isIkzelf}
                      onChange={(e) => wisselRol(account.uid, e.target.value as Rol)}
                    >
                      {ROLLEN.map((r) => (
                        <option key={r.waarde} value={r.waarde}>
                          {r.label} · {r.uitleg}
                        </option>
                      ))}
                    </select>

                    {isIkzelf ? (
                      <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                        Je eigen rol kun je niet wijzigen.
                      </span>
                    ) : account.rol === 'klant' && klant ? (
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!klant.isBekende}
                          disabled={bezig}
                          onChange={(e) => wisselBekende(klant.id, e.target.checked)}
                        />
                        Bekende van Jayce
                      </label>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                        Bekende geldt alleen voor klanten.
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppLayout>
  );
};

export default Klanten;
