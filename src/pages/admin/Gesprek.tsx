// src/pages/admin/Gesprek.tsx
import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import ChatVenster from '../../components/chat/ChatVenster';
import { useChatStore } from '../../store/chatStore';
import type { ChatBericht } from '../../types';

const Gesprek: React.FC = () => {
  const { customerId = '' } = useParams();
  const { gesprekken, berichten, loading, volgBerichten, stuurBericht, markeerGelezen } =
    useChatStore();

  const gesprek = gesprekken.find((g) => g.customerId === customerId);
  const naam = gesprek?.customerNaam ?? 'Klant';

  useEffect(() => {
    if (!customerId) return;
    const stop = volgBerichten(customerId);
    markeerGelezen(customerId, 'admin');
    return stop;
  }, [customerId, volgBerichten, markeerGelezen]);

  const verstuur = async (tekst: string) => {
    await stuurBericht({ customerId, customerNaam: naam, afzender: 'admin', tekst });
  };

  const extra = (bericht: ChatBericht) =>
    bericht.tikkieLink ? (
      <a
        href={bericht.tikkieLink}
        target="_blank"
        rel="noopener noreferrer"
        className="cmt-btn-ghost !py-1.5 !px-2 !text-xs mt-1"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Tikkie openen
      </a>
    ) : null;

  return (
    <AppLayout nav={ADMIN_NAV}>
      <Link
        to="/admin/berichten"
        className="inline-flex items-center gap-1.5 text-sm mb-3"
        style={{ color: 'var(--cmt-ink-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Alle gesprekken
      </Link>

      <h1 className="text-2xl font-bold mb-5">{naam}</h1>

      <ChatVenster
        berichten={berichten}
        loading={loading}
        ikBen="admin"
        onVerstuur={verstuur}
        renderExtra={extra}
        legeTekst="Nog geen berichten met deze klant."
      />
    </AppLayout>
  );
};

export default Gesprek;
