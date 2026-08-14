// src/pages/klant/Chat.tsx
//
// Gesprek tussen de klant en de beheerder. Hier komen de Tikkie-links binnen,
// met daaronder de knop om de ophaalkosten te betalen.

import React, { useEffect, useState } from 'react';
import { Coins, ExternalLink, Lock } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';
import ChatVenster from '../../components/chat/ChatVenster';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';
import { useStatiegeldStore } from '../../store/statiegeldStore';
import { useCustomerStore } from '../../store/customerStore';
import { createCheckoutSession } from '../../utils/stripe';
import { formatCenten } from '../../utils/constants';
import type { ChatBericht } from '../../types';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { berichten, loading, volgBerichten, stuurBericht, markeerGelezen } = useChatStore();
  const { logs, loadVoorKlant } = useStatiegeldStore();
  const { customer, loadCustomer } = useCustomerStore();

  const [betaaltLog, setBetaaltLog] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const stop = volgBerichten(user.uid);
    markeerGelezen(user.uid, 'klant');
    loadVoorKlant(user.uid);
    loadCustomer(user.uid);
    return stop;
  }, [user, volgBerichten, markeerGelezen, loadVoorKlant, loadCustomer]);

  const verstuur = async (tekst: string) => {
    if (!user) return;
    await stuurBericht({
      customerId: user.uid,
      customerNaam: user.naam,
      afzender: 'klant',
      tekst,
    });
  };

  const betaalOphaalkosten = async (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log || !customer) return;

    setFout(null);
    setBetaaltLog(logId);

    try {
      const origin = window.location.origin;
      const sessie = await createCheckoutSession({
        bedragCenten: log.servicekosten,
        productNaam: 'Ophaalkosten statiegeld',
        klantEmail: customer.email,
        orderId: log.id,
        soort: 'service',
        successUrl: `${origin}/betaling/gelukt?soort=service&order=${log.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/betaling/geannuleerd?soort=service`,
      });

      if (sessie.error || !sessie.url) {
        throw new Error(sessie.error || 'Betaling kon niet worden gestart');
      }

      window.location.href = sessie.url;
    } catch (error: unknown) {
      setFout(error instanceof Error ? error.message : 'Er ging iets mis');
      setBetaaltLog(null);
    }
  };

  /**
   * De Tikkie komt pas vrij als de ophaalkosten betaald zijn. Daarom staat de
   * knop om hem te openen hier en niet in het gespreksvenster zelf: zolang er
   * nog iets openstaat zie je in plaats daarvan de betaalknop.
   */
  const extra = (bericht: ChatBericht) => {
    if (!bericht.tikkieLink) return null;

    const log = logs.find((l) => l.id === bericht.statiegeldLogId);
    const betaald = !log || log.servicekostenStatus !== 'openstaand';

    // Contant meegegeven, maar nog niet bevestigd. Dan is de betaalknop niet de
    // eerste weg: het geld is er al, het moet alleen nog gezien worden.
    if (!betaald && log && log.servicekostenContant && !log.contantBevestigdOp) {
      return (
        <div className="mt-2 cmt-flow-stat cmt-card cmt-card-tint !p-3">
          <p className="text-sm mb-3 flex items-start gap-2">
            <Coins className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Je hebt de {formatCenten(log.servicekosten)} ophaalkosten contant meegegeven aan
              Jayce. Zodra zijn moeder bevestigt dat hij het geld heeft, komt hier de knop naar je
              Tikkie te staan.
            </span>
          </p>
          <button
            className="cmt-btn-ghost !py-2 !text-sm"
            onClick={() => betaalOphaalkosten(log.id)}
            disabled={betaaltLog === log.id}
          >
            {betaaltLog === log.id ? 'Bezig...' : 'Toch in de app betalen'}
          </button>
        </div>
      );
    }

    if (!betaald && log) {
      return (
        <div className="mt-2 cmt-flow-stat cmt-card cmt-card-tint !p-3">
          <p className="text-sm mb-3 flex items-start gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Je Tikkie staat klaar. Zodra je de {formatCenten(log.servicekosten)} ophaalkosten
              hebt betaald verschijnt hier de knop om hem te openen.
            </span>
          </p>
          <button
            className="cmt-btn-primary !py-2 !text-sm"
            onClick={() => betaalOphaalkosten(log.id)}
            disabled={betaaltLog === log.id}
          >
            {betaaltLog === log.id
              ? 'Bezig...'
              : `Betaal ${formatCenten(log.servicekosten)} ophaalkosten`}
          </button>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <a
          href={bericht.tikkieLink}
          target="_blank"
          rel="noopener noreferrer"
          className="cmt-flow-stat cmt-btn-primary !py-2 !text-sm"
        >
          <ExternalLink className="w-4 h-4" /> Open je Tikkie
        </a>
        {log?.servicekostenStatus === 'betaald' && (
          <span className="cmt-badge cmt-badge-done">Ophaalkosten betaald</span>
        )}
      </div>
    );
  };

  return (
    <AppLayout nav={KLANT_NAV} title="Berichten">
      {fout && <div className="cmt-alert cmt-alert-error mb-4">{fout}</div>}

      <ChatVenster
        berichten={berichten}
        loading={loading}
        ikBen="klant"
        onVerstuur={verstuur}
        toonTikkieKnop={false}
        renderExtra={extra}
        legeTekst="Nog geen berichten. Stel gerust een vraag, je krijgt hier ook je Tikkie."
      />
    </AppLayout>
  );
};

export default Chat;
