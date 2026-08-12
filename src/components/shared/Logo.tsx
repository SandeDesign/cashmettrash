// src/components/shared/Logo.tsx
import React from 'react';

/**
 * Versieparameter op het beeldmerk. Het logo is een tijd lang uitgeserveerd met
 * een cache van een jaar, dus alleen het bestand vervangen is niet genoeg: de URL
 * moet veranderen, anders houden bestaande bezoekers het oude logo. Verhoog dit
 * getal als logo.svg opnieuw wijzigt, samen met de iconen in manifest.json.
 */
export const LOGO_SRC = '/logo.svg?v=2';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<LogoProps['size']>, { icon: string; text: string }> = {
  sm: { icon: 'w-7 h-7', text: 'text-base' },
  md: { icon: 'w-10 h-10', text: 'text-xl' },
  lg: { icon: 'w-16 h-16', text: 'text-3xl' },
};

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src={LOGO_SRC} alt="" aria-hidden="true" className={`${s.icon} flex-shrink-0`} />
      {showText && (
        <span className={`${s.text} font-bold tracking-tight`} style={{ color: 'var(--cmt-ink)' }}>
          Cash<span style={{ color: 'var(--cmt-glas)' }}>Met</span>Trash
        </span>
      )}
    </span>
  );
};

export default Logo;
