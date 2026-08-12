// src/pages/moeder/Ideeen.tsx
//
// Mama kan hier suggesties kwijt. De beheerder ziet ze terug en vinkt ze af.

import React, { useEffect, useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import AppLayout from '../../components/layout/AppLayout';
import { MOEDER_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useInstellingenStore } from '../../store/instellingenStore';
import { stuurPushNaarRol } from '../../utils/push';
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
  const { user } = useAuth();
  const { suggesties, loading, loadSuggesties, voegSuggestieToe } = useInstellingenStore();

  const [tekst, setTekst] = useState('');
  const [bezig, setBezig] = useState(false);
  const [verstuurd, setVerstuurd] = useState(false);

  useEffect(() => {
    loadSuggesties();
  }, [loadSuggesties]);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const schoon = tekst.trim();
    if (!schoon || !user) return;

    setBezig(true);
    try {
      await voegSuggestieToe(schoon, user.uid, user.naam);
      void stuurPushNaarRol('admin', {
        titel: 'Nieuw idee',
        tekst: `${user.naam} heeft een suggestie doorgegeven.`,
        url: '/admin/ideeen',
      });
      setTekst('');
      setVerstuurd(true);
      window.setTimeout(() => setVerstuurd(false), 3000);
    } finally {
      setBezig(false);
    }
  };

  const mijne = suggesties.filter((s) => s.vanUid === user?.uid);

  return (
    <AppLayout nav={MOEDER_NAV} title="Ideeën">
      <p className="cmt-lead mb-5">
        Zie je iets dat beter kan, of maak je je ergens zorgen over? Schrijf het hier op.
      </p>

      {verstuurd && (
        <div className="cmt-alert cmt-alert-success mb-4 cmt-animate-in">
          Bedankt, je idee is doorgegeven.
        </div>
      )}

      <form onSubmit={verstuur} className="cmt-card mb-8">
        <label className="cmt-label" htmlFor="idee">
          Je idee of opmerking
        </label>
        <textarea
          id="idee"
          className="cmt-textarea mb-4"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Bijvoorbeeld: bij de school is het rond drie uur erg druk"
          maxLength={800}
        />
        <button type="submit" className="cmt-btn-primary" disabled={!tekst.trim() || bezig}>
          <Send className="w-4 h-4" /> {bezig ? 'Bezig...' : 'Versturen'}
        </button>
      </form>

      <h2 className="text-lg font-bold mb-3">Wat je eerder hebt doorgegeven</h2>

      {loading && suggesties.length === 0 ? (
        <Loading />
      ) : mijne.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <Lightbulb className="w-6 h-6" />
          </span>
          <p>Nog niets doorgegeven.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {mijne.map((suggestie) => (
            <li key={suggestie.id} className="cmt-card">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm flex-1">{suggestie.tekst}</p>
                <span className={`cmt-badge ${STATUS_KLASSE[suggestie.status]}`}>
                  {STATUS_LABEL[suggestie.status]}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--cmt-ink-muted)' }}>
                {format(new Date(suggestie.aangemaaktOp), 'd MMMM yyyy', { locale: nl })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  );
};

export default Ideeen;
