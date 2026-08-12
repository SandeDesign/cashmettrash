// src/pages/klant/BetalingGeannuleerd.tsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { KLANT_NAV } from '../../components/layout/navItems';

const BetalingGeannuleerd: React.FC = () => {
  const [params] = useSearchParams();
  const isService = params.get('soort') === 'service';

  return (
    <AppLayout nav={KLANT_NAV}>
      <div className={`${isService ? 'cmt-flow-stat' : 'cmt-flow-glas'} max-w-md mx-auto`}>
        <div className="cmt-card text-center cmt-animate-in">
          <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--cmt-ink-muted)' }} />
          <h1 className="text-xl font-bold mb-2">Betaling afgebroken</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--cmt-ink-soft)' }}>
            {isService
              ? 'Er is niets afgeschreven. De ophaalkosten staan nog open, je kunt ze vanuit je berichten alsnog betalen.'
              : 'Er is niets afgeschreven. Je aanvraag staat nog open, dus je kunt hem opnieuw proberen wanneer het jou uitkomt.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to={isService ? '/chat' : '/glas'} className="cmt-btn-primary">
              {isService ? 'Naar mijn berichten' : 'Opnieuw proberen'}
            </Link>
            <Link to="/mijn" className="cmt-btn-ghost">
              Naar mijn overzicht
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BetalingGeannuleerd;
