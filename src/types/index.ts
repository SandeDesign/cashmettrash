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

/** Klantgegevens: customers/{customerId}. De customerId is gelijk aan de uid van de klant. */
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
/* GLAS-FLOW. Klant betaalt EUR 4,99 per ophaalbeurt via Stripe.       */
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
/* STATIEGELD-FLOW. Puur registratie en logging.                       */
/* Geen Stripe, geen betaling in de app. Marc scant in bij Viatim en   */
/* stuurt zelf een Tikkie naar de klant.                               */
/* ------------------------------------------------------------------ */

export type StatiegeldStatus = 'aangemeld' | 'opgehaald' | 'verwerktBijViatim' | 'tikkieVerstuurd';

/**
 * Ophaalkosten voor statiegeld. Dit is nadrukkelijk niet het statiegeld zelf:
 * dat komt onaangeroerd uit Viatim en gaat volledig naar de klant. Deze kosten
 * worden achteraf in rekening gebracht, tegelijk met de Tikkie.
 */
export type ServicekostenStatus = 'nietVerschuldigd' | 'openstaand' | 'betaald';

export interface StatiegeldItems {
  plastic: number;
  blik: number;
}

/** statiegeldLogs/{logId}. Bevat bewust geen velden voor het statiegeld zelf. */
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
  jayceId?: string;

  /* Tikkie uit Viatim. Het bedrag is puur registratie: de betaling zelf loopt
     buiten de app om en kan niet worden aangepast. */
  tikkieVerstuurdOp?: string;
  tikkieBedrag?: number;
  tikkieLink?: string;

  /* Ophaalkosten, apart van het statiegeld. */
  servicekosten: number;
  servicekostenStatus: ServicekostenStatus;
  servicekostenBetaaldOp?: string;
  serviceStripeSessionId?: string;
  serviceStripeStatus?: string;
}

/* ------------------------------------------------------------------ */
/* CHAT tussen klant en admin. Jayce zit hier bewust niet in, zodat    */
/* geldvragen niet bij hem terechtkomen.                               */
/* ------------------------------------------------------------------ */

/** chatGesprekken/{customerId} */
export interface ChatGesprek {
  customerId: string;
  customerNaam: string;
  laatsteBericht: string;
  laatsteBerichtOp: string;
  ongelezenKlant: number;
  ongelezenAdmin: number;
}

/** chatGesprekken/{customerId}/berichten/{berichtId} */
export interface ChatBericht {
  id: string;
  afzender: 'klant' | 'admin';
  tekst: string;
  aangemaaktOp: string;
  /** Gezet bij een Tikkie-bericht, zodat de klant er knoppen bij krijgt. */
  tikkieLink?: string;
  statiegeldLogId?: string;
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
