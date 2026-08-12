// src/types/index.ts

export type Rol = 'klant' | 'jayce' | 'admin';

/** Account-document: users/{uid} */
export interface User {
  uid: string;
  email: string;
  naam: string;
  rol: Rol;
  createdAt: string;
  updatedAt: string;
}

/** Klantgegevens: customers/{customerId} — customerId is gelijk aan de uid van de klant. */
export interface Customer {
  id: string;
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  telefoon: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* GLAS-FLOW — klant betaalt €4,99 per ophaalbeurt via Stripe.         */
/* Geld gaat naar de bedrijfsrekening, niet naar Jayce.                */
/* ------------------------------------------------------------------ */

export type GlasStatus = 'aangemeld' | 'ingepland' | 'opgehaald' | 'betaald' | 'geannuleerd';

/** glasOrders/{orderId} */
export interface GlasOrder {
  id: string;
  customerId: string;
  customerNaam: string;
  adres: string;
  postcode: string;
  plaats: string;
  status: GlasStatus;
  /** Vast bedrag in centen per ophaalbeurt. Altijd GLAS_PRIJS_CENTEN. */
  bedrag: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeStatus?: string;
  opmerking?: string;
  aangemaaktOp: string;
  betaaldOp?: string;
  opgehaaldOp?: string;
  jayceId?: string;
}

/* ------------------------------------------------------------------ */
/* STATIEGELD-FLOW — puur registratie/logging.                         */
/* Geen Stripe, geen betaling in de app. Marc scant in bij Viatim en   */
/* stuurt zelf een Tikkie naar de klant.                               */
/* ------------------------------------------------------------------ */

export type StatiegeldStatus = 'aangemeld' | 'opgehaald' | 'verwerktBijViatim' | 'tikkieVerstuurd';

export interface StatiegeldItems {
  plastic: number;
  blik: number;
}

/** statiegeldLogs/{logId} — bevat bewust GEEN payment- of Stripe-velden. */
export interface StatiegeldLog {
  id: string;
  customerId: string;
  customerNaam: string;
  adres: string;
  postcode: string;
  plaats: string;
  /** Schatting door de klant bij aanmelden. */
  items: StatiegeldItems;
  /** Werkelijke telling door Jayce bij ophalen. */
  itemsWerkelijk?: StatiegeldItems;
  status: StatiegeldStatus;
  opmerking?: string;
  aangemaaktOp: string;
  opgehaaldOp?: string;
  verwerktOp?: string;
  tikkieVerstuurdOp?: string;
  /** Bedrag in centen dat via Tikkie is uitbetaald. Alleen door admin gezet. */
  tikkieBedrag?: number;
  jayceId?: string;
}

/* ------------------------------------------------------------------ */

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface RegisterData {
  naam: string;
  email: string;
  wachtwoord: string;
  telefoon: string;
  adres: string;
  postcode: string;
  plaats: string;
}
