// src/components/common/MeldingenKaart.tsx
//
// Kaartje om meldingen aan te zetten. De teksten zijn instelbaar, zodat de
// pagina van Jayce dezelfde kaart kan gebruiken met taal die bij hem past.
//
// De kaart verdwijnt zodra meldingen aanstaan: dan valt er niets meer te kiezen.

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { usePushMeldingen } from '../../hooks/usePushMeldingen';
import type { Rol } from '../../types';

interface MeldingenKaartProps {
  uid: string | undefined;
  rol: Rol | undefined;
  titel?: string;
  uitleg?: string;
  knopTekst?: string;
}

const MeldingenKaart: React.FC<MeldingenKaartProps> = ({
  uid,
  rol,
  titel = 'Meldingen aanzetten',
  uitleg = 'Dan krijg je een bericht op je telefoon zodra er iets nieuws is.',
  knopTekst = 'Zet meldingen aan',
}) => {
  const { status, zetAan } = usePushMeldingen(uid, rol);

  // Aan, niet mogelijk of nog niet ingesteld: dan is er niets te kiezen.
  if (status === 'aan' || status === 'nietOndersteund' || status === 'geenSleutel') return null;

  if (status === 'moetInstalleren') {
    return (
      <div className="cmt-card cmt-card-tint mt-6">
        <Smartphone className="w-6 h-6 mb-2" style={{ color: 'var(--cmt-accent)' }} />
        <p className="font-bold mb-1">{titel}</p>
        <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-soft)' }}>
          Op een iPhone of iPad kan dat pas als de app op je beginscherm staat.
        </p>
        <Link to="/installeren" className="cmt-btn-secondary !py-2 !text-sm">
          Laat me zien hoe
        </Link>
      </div>
    );
  }

  if (status === 'geweigerd') {
    return (
      <div className="cmt-card mt-6">
        <BellOff className="w-6 h-6 mb-2" style={{ color: 'var(--cmt-ink-muted)' }} />
        <p className="font-bold mb-1">Meldingen staan uit</p>
        <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
          Je hebt eerder nee gezegd. Je kunt het weer aanzetten in de instellingen van je
          browser, bij de rechten voor deze site.
        </p>
      </div>
    );
  }

  return (
    <div className="cmt-card cmt-card-tint mt-6">
      <Bell className="w-6 h-6 mb-2" style={{ color: 'var(--cmt-accent)' }} />
      <p className="font-bold mb-1">{titel}</p>
      <p className="text-sm mb-3" style={{ color: 'var(--cmt-ink-soft)' }}>
        {uitleg}
      </p>
      <button className="cmt-btn-primary" onClick={zetAan} disabled={status === 'bezig'}>
        {status === 'bezig' ? 'Momentje...' : knopTekst}
      </button>
    </div>
  );
};

export default MeldingenKaart;
