// src/pages/GeenToegang.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const GeenToegang: React.FC = () => {
  const { dashboardPad } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="cmt-card max-w-sm w-full text-center">
        <ShieldOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--cmt-ink-muted)' }} />
        <h1 className="text-xl font-bold mb-2">Geen toegang</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--cmt-ink-soft)' }}>
          Deze pagina hoort niet bij jouw account.
        </p>
        <Link to={dashboardPad} className="cmt-btn-primary">
          Terug naar mijn pagina
        </Link>
      </div>
    </div>
  );
};

export default GeenToegang;
