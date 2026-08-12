// src/pages/klant/Chat.tsx
//
// Gesprek tussen de klant en de beheerder. Hier komen de Tikkie-links binnen,
// met daaronder de knop om de ophaalkosten te betalen.

import React, { useEffect, useState } from 'react';
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
   * De knop om de Tikkie te openen zit al in het gespreksvenster zelf. Hier komt
   * alleen wat daarbovenop hoort: de ophaalkosten afrekenen.
   */
  const extra = (bericht: ChatBericht) => {
    if (!bericht.tikkieLink) return null;

    const log = logs.find((l) => l.id === bericht.statiegeldLogId);
    const moetBetalen = log?.servicekostenStatus === 'openstaand';

    return (
      <div className="mt-2 flex flex-col gap-2 items-start">
        {moetBetalen && log && (
          <button
            className="cmt-btn-secondary !py-2 !text-sm"
            onClick={() => betaalOphaalkosten(log.id)}
            disabled={betaaltLog === log.id}
          >
            {betaaltLog === log.id
              ? 'Bezig...'
              : `Betaal ${formatCenten(log.servicekosten)} ophaalkosten`}
          </button>
        )}

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
        renderExtra={extra}
        legeTekst="Nog geen berichten. Stel gerust een vraag, je krijgt hier ook je Tikkie."
      />
    </AppLayout>
  );
};

export default Chat;
