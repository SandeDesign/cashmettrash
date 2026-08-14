// src/utils/bedrijf.ts
//
// Alle bedrijfsgegevens op één plek. De juridische pagina's lezen hieruit, zodat
// er nooit twee versies van hetzelfde adres in omloop raken.
//
// LET OP: de waarden met NOG_INVULLEN moeten worden aangevuld voordat de app
// publiek gaat. Zolang ze leegstaan tonen de pagina's een zichtbare waarschuwing
// in plaats van een verzonnen waarde.

const NOG_INVULLEN = '';

export const BEDRIJF = {
  /** Handelsnaam waaronder de dienst naar buiten treedt. */
  handelsnaam: 'CashMetTrash',
  /** Rechtspersoon die de overeenkomst aangaat en de betalingen ontvangt. */
  rechtspersoon: 'Buddy BV',

  kvk: '98132873',
  btw: 'NL868369755B01',

  /* Vestigingsadres van de rechtspersoon. Dit is ook het adres waar post en
     privacyverzoeken naartoe kunnen. Let op: dit is niet de plaats waar we
     ophalen, dat is het werkgebied hieronder. */
  adres: 'Oude Maastrichterweg 16',
  postcode: '6162 BD',
  plaats: 'Geleen',

  email: 'info@cashmettrash.nl',
  telefoon: NOG_INVULLEN,

  /** Waar we ophalen, zoals genoemd in de voorwaarden. */
  werkgebied: 'Tilburg, rond de Magriethof',
  /** Alleen de plaats daarvan, voor korte zinnen zoals in de footer. */
  werkgebiedPlaats: 'Tilburg',

  /** Datum waarop de juridische teksten voor het laatst zijn bijgewerkt. */
  laatstBijgewerkt: '14 augustus 2026',
} as const;

/** Geeft de waarde terug, of null als hij nog niet is ingevuld. */
export function bedrijfsWaarde(sleutel: keyof typeof BEDRIJF): string | null {
  const waarde = BEDRIJF[sleutel];
  return waarde ? waarde : null;
}

/**
 * Welke verplichte gegevens nog ontbreken, in gewone woorden. Een e-mailadres
 * telt niet als ontbrekend zolang er een postadres staat: dat is dan het
 * contactadres. Voor verkoop op afstand is een e-mailadres wel het gebruikelijke
 * minimum, dus vul het aan zodra je er een hebt.
 */
export function ontbrekendeBedrijfsgegevens(): string[] {
  const ontbreekt: string[] = [];
  if (!BEDRIJF.kvk) ontbreekt.push('KvK-nummer');
  if (!BEDRIJF.adres) ontbreekt.push('vestigingsadres');
  if (!BEDRIJF.postcode) ontbreekt.push('postcode');
  if (!BEDRIJF.email && !BEDRIJF.adres) ontbreekt.push('contactadres');
  return ontbreekt;
}

/** True zodra er nog verplichte gegevens ontbreken. */
export function bedrijfsgegevensOnvolledig(): boolean {
  return ontbrekendeBedrijfsgegevens().length > 0;
}
