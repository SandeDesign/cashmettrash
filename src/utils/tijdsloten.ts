// src/utils/tijdsloten.ts
//
// Een tijdslot is een vast moment in de week ("woensdag 16:00 tot 17:30"). Bij
// het bevestigen rekent de app daar de eerstvolgende datum bij, zodat de klant
// een echte dag en tijd te zien krijgt.

import type { Tijdslot } from '../types';

export const DAGEN = [
  'zondag',
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
];

/** Korte omschrijving zoals hij in een knop past: "woensdag 16:00 tot 17:30". */
export function omschrijfSlot(slot: Tijdslot): string {
  return `${DAGEN[slot.dagVanDeWeek]} ${slot.van} tot ${slot.tot}`;
}

function metTijd(datum: Date, tijd: string): Date {
  const [uur, minuut] = tijd.split(':').map(Number);
  const nieuw = new Date(datum);
  nieuw.setHours(uur, minuut ?? 0, 0, 0);
  return nieuw;
}

/**
 * De eerstvolgende keer dat dit tijdslot langskomt, gerekend vanaf `vanaf`.
 * Is het vandaag maar is de begintijd al voorbij, dan pakken we volgende week.
 */
export function volgendeKeer(slot: Tijdslot, vanaf: Date = new Date()): { van: Date; tot: Date } {
  const dagenVooruit = (slot.dagVanDeWeek - vanaf.getDay() + 7) % 7;

  const dag = new Date(vanaf);
  dag.setDate(dag.getDate() + dagenVooruit);

  let van = metTijd(dag, slot.van);
  if (van.getTime() <= vanaf.getTime()) {
    dag.setDate(dag.getDate() + 7);
    van = metTijd(dag, slot.van);
  }

  const tot = metTijd(van, slot.tot);
  // Een slot dat over middernacht heen loopt bestaat niet, maar mocht iemand
  // toch 22:00 tot 01:00 invullen, dan hoort het einde de dag erna te liggen.
  if (tot.getTime() <= van.getTime()) tot.setDate(tot.getDate() + 1);

  return { van, tot };
}
