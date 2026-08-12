// src/components/layout/PublicHeader.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../shared/Logo';

/** Header voor de publieke landingspagina. Krijgt een rand zodra je scrollt. */
const PublicHeader: React.FC = () => {
  const [gescrold, setGescrold] = useState(false);

  useEffect(() => {
    const onScroll = () => setGescrold(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 safe-area-top transition-colors"
      style={{
        background: gescrold ? 'rgba(245, 243, 238, 0.9)' : 'transparent',
        borderBottom: `1px solid ${gescrold ? 'var(--cmt-border)' : 'transparent'}`,
        backdropFilter: gescrold ? 'blur(10px)' : undefined,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" aria-label="CashMetTrash, naar boven">
          {/* Op de smalste telefoons past het woordmerk niet naast de knop. */}
          <span className="hidden xs:block">
            <Logo size="sm" />
          </span>
          <span className="xs:hidden">
            <Logo size="sm" showText={false} />
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Op smalle schermen is er geen ruimte naast het logo; de inloglink
              staat dan nog op de aanmeldpagina en in de footer.
              Het verbergen gebeurt op een wrapper: de cmt-btn-* classes zetten
              zelf een display en zouden Tailwinds .hidden overrulen. */}
          <span className="hidden xs:block">
            <Link to="/login" className="cmt-btn-ghost">
              Inloggen
            </Link>
          </span>
          <Link to="/registreren" className="cmt-btn-primary">
            Aanmelden
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicHeader;
