// src/utils/constants.ts
import type { GlasStatus, StatiegeldStatus } from '../types';

/** Vaste prijs per glas-ophaalbeurt, in centen. Niet per fles. */
export const GLAS_PRIJS_CENTEN = 499;

/**
 * PHP-proxy endpoints. De Stripe secret key staat uitsluitend server-side op de proxy.
 * Instelbaar via Vercel-omgevingsvariabelen; de defaults gelden voor productie.
 */
export const CHECKOUT_URL =
  import.meta.env.VITE_CHECKOUT_URL || 'https://internedata.nl/uploads/cashmettrash/checkout.php';
export const STRIPE_PROXY_URL =
  import.meta.env.VITE_STRIPE_PROXY_URL ||
  'https://internedata.nl/uploads/cashmettrash/stripe-proxy.php';

/** Formatteert een bedrag in centen als "€ 4,99". */
export function formatCenten(centen: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(centen / 100);
}

export const GLAS_STATUS_LABEL: Record<GlasStatus, string> = {
  aangemeld: 'Aangemeld',
  ingepland: 'Ingepland',
  opgehaald: 'Opgehaald',
  betaald: 'Betaald',
  geannuleerd: 'Geannuleerd',
};

export const STATIEGELD_STATUS_LABEL: Record<StatiegeldStatus, string> = {
  aangemeld: 'Aangemeld',
  opgehaald: 'Opgehaald',
  verwerktBijViatim: 'Verwerkt bij Viatim',
  tikkieVerstuurd: 'Tikkie verstuurd',
};

/** Google Maps navigatie-link naar een adres. */
export function mapsLink(adres: string, postcode: string, plaats: string): string {
  const bestemming = encodeURIComponent(`${adres}, ${postcode} ${plaats}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${bestemming}`;
}
