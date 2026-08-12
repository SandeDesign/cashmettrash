// src/utils/links.ts
//
// Links in chatberichten. Mensen plakken een adres zelden compleet: "tikkie.me/pay/x"
// of "www.tikkie.me/..." komt net zo vaak voor als een volledige https-link. We
// maken er hier een bruikbare link van in plaats van de invoer af te keuren.

/** Tekens die vaak per ongeluk aan het eind van een geplakte link blijven hangen. */
const RESTJES = /[.,;:!?)\]}>'"]+$/;

/** Herkent zowel https://... als www.... en kale domeinen met een pad. */
export const LINK_PATROON =
  /((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<>"']*)/gi;

/**
 * Maakt van losse invoer een adres dat de browser aankan. Geeft null als er
 * echt niets van te maken valt.
 */
export function normaliseerLink(invoer: string): string | null {
  const schoon = invoer.trim().replace(RESTJES, '');
  if (!schoon) return null;

  const compleet = /^https?:\/\//i.test(schoon) ? schoon : `https://${schoon}`;

  try {
    const url = new URL(compleet);
    // Een adres zonder punt in de hostnaam is geen website maar een typfout.
    if (!url.hostname.includes('.')) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Ziet dit eruit als een link? Gebruikt om invoer te controleren. */
export function isLink(invoer: string): boolean {
  return normaliseerLink(invoer) !== null;
}
