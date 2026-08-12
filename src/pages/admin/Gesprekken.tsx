// src/pages/admin/Gesprekken.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { ADMIN_NAV } from '../../components/layout/navItems';
import Loading from '../../components/shared/Loading';
import { useChatStore } from '../../store/chatStore';

const geleden = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: nl });

const Gesprekken: React.FC = () => {
  const { gesprekken, loading, error, volgGesprekken } = useChatStore();

  useEffect(() => volgGesprekken(), [volgGesprekken]);

  return (
    <AppLayout nav={ADMIN_NAV} title="Berichten">
      {error && <div className="cmt-alert cmt-alert-error mb-4">{error}</div>}

      {loading && gesprekken.length === 0 ? (
        <Loading />
      ) : gesprekken.length === 0 ? (
        <div className="cmt-card cmt-empty-state">
          <span className="cmt-empty-state-icon">
            <MessageSquare className="w-6 h-6" />
          </span>
          <p>Nog geen gesprekken.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {gesprekken.map((gesprek) => (
            <li key={gesprek.customerId}>
              <Link
                to={`/admin/berichten/${gesprek.customerId}`}
                className="cmt-card flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{gesprek.customerNaam}</p>
                  <p className="text-sm truncate" style={{ color: 'var(--cmt-ink-soft)' }}>
                    {gesprek.laatsteBericht}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cmt-ink-muted)' }}>
                    {geleden(gesprek.laatsteBerichtOp)}
                  </p>
                </div>

                {gesprek.ongelezenAdmin > 0 && (
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold"
                    style={{ background: 'var(--cmt-glas)', color: '#fff' }}
                  >
                    {gesprek.ongelezenAdmin}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  );
};

export default Gesprekken;
