// src/utils/csv.ts

/** Escapet één CSV-veld volgens RFC 4180. */
function veld(waarde: unknown): string {
  const tekst = waarde == null ? '' : String(waarde);
  return /[";\n\r]/.test(tekst) ? `"${tekst.replace(/"/g, '""')}"` : tekst;
}

/**
 * Bouwt een CSV met puntkomma's als scheidingsteken — dat opent in de
 * Nederlandse Excel-instelling direct in kolommen.
 */
export function naarCsv(kolommen: string[], rijen: unknown[][]): string {
  const regels = [kolommen, ...rijen].map((rij) => rij.map(veld).join(';'));
  // BOM zodat Excel UTF-8 herkent.
  return '﻿' + regels.join('\r\n');
}

/** Start een download van de CSV-inhoud. */
export function downloadCsv(bestandsnaam: string, inhoud: string): void {
  const blob = new Blob([inhoud], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = bestandsnaam;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Bedrag in centen als "4,99" — komma-decimaal voor Excel NL. */
export function centenVoorCsv(centen: number | undefined): string {
  return centen == null ? '' : (centen / 100).toFixed(2).replace('.', ',');
}
