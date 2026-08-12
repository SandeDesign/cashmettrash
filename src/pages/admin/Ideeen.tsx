// src/pages/admin/Ideeen.tsx
//
// De suggesties die mama doorgeeft. Je markeert ze als gelezen of gedaan, zodat
// duidelijk blijft wat er nog openstaat.

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useInstellingenStore } from '../../store/instellingenStore';
import type { SuggestieStatus } from '../../types';

const STATUS_LABEL: Record<SuggestieStatus, string> = {
  nieuw: 'Nieuw',
  gelezen: 'Gelezen',
  gedaan: 'Gedaan',
};

const STATUS_KLASSE: Record<SuggestieStatus, string> = {
  nieuw: 'cmt-badge-warning',
  gelezen: 'cmt-badge-neutral',
  gedaan: 'cmt-badge-done',
};

const Ideeen: React.FC = () => {
  const { suggesties, loading, error, loadSuggesties, setSuggestieStatus } = useInstellingenStore();
  const [bezigMet, setBezigMet] = useState<string | null>(null);

  useEffect(() => {
    loadSuggesties();
  }, [loadSuggesties]);

  const openstaand = useMemo(
    () => suggesties.filter((s) => s.status !== 'gedaan'),
    [suggesties]
  );
  const afgerond = useMemo(() => suggesties.filter((s) => s.status === 'gedaan'), [suggesties]);

  const zet = async (id: string, status: SuggestieStatus) => {
    setBezigMet(id);
    try {
      await setSuggestieStatus(id, status);
    } finally {
      setBezigMet(null);
    }
  };

  const regel = (id: string, tekst: string, vanNaam: string, aangemaaktOp: string, status: SuggestieStatus) => (
    <li key={id} className="cmt-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm flex-1">{tekst}</p>
        <span className={`cmt-badge ${STATUS_KLASSE[status]}`}>{STATUS_LABEL[status]}</span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--cmt-ink-muted)' }}>
        {vanNaam} · {format(new Date(aangemaaktOp), 'd MMMM yyyy', { locale: nl })}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === 'nieuw' && (
          <button
            className="cmt-btn-ghost !py-2 !text-sm"
            disabled={bezigMet === id}
            onClick={() => zet(id, 'gelezen')}
          >
            <Eye className="w-4 h-4" /> Gelezen
          </button>
        )}
        {status !== 'gedaan' && (
          <button
            className="cmt-btn-secondary !py-2 !text-sm"
            disabled={bezigMet === id}
            onClick={() => zet(id, 'gedaan')}
          >
            <Check className="w-4 h-4" /> Gedaan
          </button>
        )}
        {status === 'gedaan' && (
          <button
            className="cmt-btn-ghost !py-2 !text-sm"
            disabled={bezigMet === id}
            onClick={() => zet(id, 'gelezen')}
          >
            Toch weer openzetten
          </button>
        )}
      </div>
    </li>
  );

  return (
    <AppLayout nav={ADMIN_NAV} title="Ideeën">
      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      {loading && suggesties.length === 0 ? (
        <Loading />
      ) : suggesties.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Lightbulb className="w-6 h-6" />
          </span>
          <p>Er zijn nog geen ideeën doorgegeven.</p>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">Openstaand</h2>
            {openstaand.length === 0 ? (
              <div className="cmt-card cmt-empty-state !py-6">
                <p>Alles is afgehandeld.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {openstaand.map((s) =>
                  regel(s.id, s.tekst, s.vanNaam, s.aangemaaktOp, s.status)
                )}
              </ul>
            )}
          </section>

          {afgerond.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Afgehandeld</h2>
              <ul className="space-y-2">
                {afgerond.map((s) => regel(s.id, s.tekst, s.vanNaam, s.aangemaaktOp, s.status))}
              </ul>
            </section>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default Ideeen;
