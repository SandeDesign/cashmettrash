// src/utils/push.ts
//
// Pushmeldingen lopen via dezelfde PHP-proxy als Stripe. De app kan zelf geen
// melding versturen: daar is een servergeheim voor nodig, en dat hoort niet in
// de browser. De proxy zoekt zelf op welke apparaten bij een rol of klant horen,
// dus de app hoeft geen tokens van anderen te kennen.
//
// Meldingen zijn bewust "best effort": mislukt het versturen, dan draait de rest
// van het proces gewoon door. Daarom gooit niets hier een fout omhoog.

import { auth } from '../lib/firebase';
import { PUSH_URL } from './constants';
import type { Rol } from '../types';

export interface Melding {
  titel: string;
  tekst: string;
  /** Pad binnen de app waar de melding naartoe leidt, bijvoorbeeld /jayce. */
  url: string;
}

interface PushDoel {
  /** Iedereen met deze rol. */
  rol?: Rol;
  /** Eén specifieke klant. */
  customerId?: string;
}

const TIMEOUT_MS = 10000;

async function verstuur(doel: PushDoel, melding: Melding): Promise<void> {
  const gebruiker = auth.currentUser;
  if (!gebruiker) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const idToken = await gebruiker.getIdToken();

    const response = await fetch(PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ ...doel, ...melding }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.warn('[Push] versturen mislukt:', data.error || response.status);
    }
  } catch (error: unknown) {
    // Bewust alleen loggen: een gemiste melding mag het proces niet blokkeren.
    console.warn('[Push] versturen mislukt:', error);
  } finally {
    clearTimeout(timeout);
  }
}

/** Stuurt een melding naar iedereen met deze rol. */
export function stuurPushNaarRol(rol: Rol, melding: Melding): Promise<void> {
  return verstuur({ rol }, melding);
}

/** Stuurt een melding naar één klant. */
export function stuurPushNaarKlant(customerId: string, melding: Melding): Promise<void> {
  return verstuur({ customerId }, melding);
}
