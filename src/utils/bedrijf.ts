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

  kvk: NOG_INVULLEN,
  btw: NOG_INVULLEN,

  adres: NOG_INVULLEN,
  postcode: NOG_INVULLEN,
  plaats: 'Tilburg',

  email: NOG_INVULLEN,
  telefoon: NOG_INVULLEN,

  /** Werkgebied, zoals genoemd in de voorwaarden. */
  werkgebied: 'Tilburg, rond de Magriethof',

  /** Datum waarop de juridische teksten voor het laatst zijn bijgewerkt. */
  laatstBijgewerkt: '12 augustus 2026',
} as const;

/** Geeft de waarde terug, of null als hij nog niet is ingevuld. */
export function bedrijfsWaarde(sleutel: keyof typeof BEDRIJF): string | null {
  const waarde = BEDRIJF[sleutel];
  return waarde ? waarde : null;
}

/** True zodra er nog verplichte gegevens ontbreken. */
export function bedrijfsgegevensOnvolledig(): boolean {
  return !BEDRIJF.kvk || !BEDRIJF.adres || !BEDRIJF.postcode || !BEDRIJF.email;
}
