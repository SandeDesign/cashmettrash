// src/types/index.ts

export type Rol = 'klant' | 'jayce' | 'moeder' | 'admin';

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
  /**
   * Iemand die dicht bij Jayce staat. Een bekende mag buiten het werkgebied
   * wonen en kan zijn statiegeld aan Jayce schenken. Alleen de admin zet dit.
   */
  isBekende?: boolean;
  /** Coordinaten van het adres, voor de routeplanner en de straalcontrole. */
  lat?: number;
  lon?: number;
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

  /* Wanneer Jayce heeft gezegd dat hij langskomt. Hij kiest een tijdslot dat
     mama of de beheerder heeft klaargezet; de app rekent daar een datum bij. */
  tijdslotId?: string;
  geplandVan?: string;
  geplandTot?: string;

  /* Het moment dat de klant zelf het handigst vond. Een wens, geen afspraak:
     Jayce mag er gewoon van afwijken. */
  voorkeurTijdslotId?: string;
  voorkeurVan?: string;
  voorkeurTot?: string;
}

/* ------------------------------------------------------------------ */
/* STATIEGELD-FLOW. Puur registratie en logging.                       */
/* Geen Stripe, geen betaling in de app. Marc scant in bij Viatim en   */
/* stuurt zelf een Tikkie naar de klant.                               */
/* ------------------------------------------------------------------ */

export type StatiegeldStatus =
  | 'aangemeld'
  | 'ingepland'
  | 'opgehaald'
  | 'verwerktBijViatim'
  | 'tikkieVerstuurd';

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

  /* Het tijdslot dat Jayce bij het bevestigen heeft gekozen. */
  tijdslotId?: string;
  geplandVan?: string;
  geplandTot?: string;

  /* De wens van de klant. Jayce mag er van afwijken. */
  voorkeurTijdslotId?: string;
  voorkeurVan?: string;
  voorkeurTot?: string;

  /* Tikkie uit Viatim. Het bedrag is puur registratie: de betaling zelf loopt
     buiten de app om en kan niet worden aangepast. */
  tikkieVerstuurdOp?: string;
  tikkieBedrag?: number;
  tikkieLink?: string;

  /**
   * De bekende schenkt dit statiegeld aan Jayce. Er gaat dan geen Tikkie naar de
   * klant en er worden geen ophaalkosten gerekend.
   */
  geschonken?: boolean;

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

/* ------------------------------------------------------------------ */
/* WERKGEBIED EN VEILIGHEID                                            */
/* Jayce rijdt op de skelter, dus het gebied is klein en de route moet  */
/* veilig zijn. Mama beheert de plekken die vermeden moeten worden.     */
/* ------------------------------------------------------------------ */

/** instellingen/werkgebied, één document. */
export interface Werkgebied {
  /** Postcodes waar we ophalen, als begin van de postcode: ['5045', '5046']. */
  postcodes: string[];
  /* Waar de ronde begint en eindigt: thuis. Het adres bewaren we erbij, zodat
     de beheerder het kan nakijken en opnieuw kan laten opzoeken. */
  thuisAdres?: string;
  thuisPostcode?: string;
  thuisPlaats?: string;
  middelpuntLat: number;
  middelpuntLon: number;
  /** Tot hier mag Jayce alleen op pad, in meters. */
  straalAlleenMeters: number;
  /**
   * De buitengrens van de ronde, in meters. Daarbuiten kan niemand een aanvraag
   * doen, ook niet met mama erbij. Alleen een bekende mag hier overheen.
   * Ligt altijd op of buiten `straalAlleenMeters`.
   */
  maxAfstandMeters: number;
  /** Vanaf dit aantal flessen en blikjes samen is het te zwaar om alleen te doen. */
  maxItemsAlleen: number;
  bijgewerktOp: string;
}

/**
 * tijdsloten/{id}: de momenten waarop Jayce langs mag komen. Mama en de
 * beheerder zetten ze klaar; Jayce kiest er eentje bij het bevestigen. Een
 * tijdslot herhaalt zich wekelijks, dus we bewaren alleen de dag en de tijden.
 */
export interface Tijdslot {
  id: string;
  /** 0 is zondag, 1 maandag, tot en met 6 zaterdag. Zoals `Date.getDay()`. */
  dagVanDeWeek: number;
  /** Begintijd als "16:00". */
  van: string;
  /** Eindtijd als "17:30". */
  tot: string;
  actief: boolean;
  aangemaaktDoor: string;
  aangemaaktOp: string;
}

/** gevaarlijkePlekken/{id}, aangewezen door mama. */
export interface GevaarlijkePlek {
  id: string;
  lat: number;
  lon: number;
  /** Hoe groot de omweg eromheen moet zijn, in meters. */
  straalMeters: number;
  omschrijving: string;
  aangemaaktDoor: string;
  aangemaaktOp: string;
}

export type SuggestieStatus = 'nieuw' | 'gelezen' | 'gedaan';

/** suggesties/{id}: ideeën van mama voor de beheerder. */
export interface Suggestie {
  id: string;
  tekst: string;
  vanNaam: string;
  vanUid: string;
  status: SuggestieStatus;
  aangemaaktOp: string;
}

/** Een ophaaltaak zoals hij op de kaart en in de route staat. */
export interface Ophaalpunt {
  id: string;
  soort: 'glas' | 'statiegeld';
  customerNaam: string;
  adres: string;
  postcode: string;
  plaats: string;
  lat?: number;
  lon?: number;
  /** Aantal stuks, alleen bij statiegeld. */
  aantalItems: number;
  /** Te zwaar of te ver om alleen te doen. */
  hulpNodig: boolean;
}
