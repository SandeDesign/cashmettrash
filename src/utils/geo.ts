// src/utils/geo.ts
//
// Kaartdiensten. Twee dingen lopen hier langs een derde partij, en dat staat ook
// zo in de privacyverklaring:
//
//   - OpenRouteService berekent de route en zet adressen om naar coordinaten.
//   - OpenStreetMap levert de kaarttegels.
//
// De route wordt bewust met het fietsprofiel berekend, en de plekken die mama
// heeft aangewezen worden als verboden gebied meegegeven. Jayce rijdt op een
// skelter, dus een route die "technisch de snelste" is deugt hier niet.

import type { GevaarlijkePlek } from '../types';

const ORS_SLEUTEL = import.meta.env.VITE_ORS_API_KEY;

// OpenRouteService verhuist van api.openrouteservice.org naar api.heigit.org.
// Zolang het oude adres nog werkt houden we dat aan; overstappen is straks een
// kwestie van VITE_ORS_BASIS zetten in Vercel, zonder de code aan te raken.
const ORS_BASIS = import.meta.env.VITE_ORS_BASIS || 'https://api.openrouteservice.org';

// Het fietsprofiel. Let op: 'cycling-safe' bestaat niet bij deze dienst en gaf
// een foutmelding terug. De geldige fietsprofielen zijn cycling-regular,
// cycling-road, cycling-mountain en cycling-electric. Regular is het gewone
// stadsfietsen: fietspaden waar die er zijn, rustige straten waar niet.
const ORS_PROFIEL = 'cycling-regular';

/** Zonder sleutel doet de routeplanner niets; de app blijft wel werken. */
export const routeplannerBeschikbaar = Boolean(ORS_SLEUTEL);

export interface Punt {
  lat: number;
  lon: number;
}

/** Afstand in meters tussen twee punten, hemelsbreed. */
export function afstandMeters(a: Punt, b: Punt): number {
  const R = 6371000;
  const rad = (graden: number) => (graden * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Zet een adres om naar coordinaten. Geeft null als het niet lukt. */
export async function zoekCoordinaten(
  adres: string,
  postcode: string,
  plaats: string
): Promise<Punt | null> {
  if (!ORS_SLEUTEL) return null;

  try {
    const zoek = encodeURIComponent(`${adres}, ${postcode} ${plaats}, Nederland`);
    const response = await fetch(
      `${ORS_BASIS}/geocode/search?api_key=${ORS_SLEUTEL}&text=${zoek}&boundary.country=NL&size=1`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const coord = data?.features?.[0]?.geometry?.coordinates;
    // OpenRouteService geeft [lengtegraad, breedtegraad], andersom dan wij.
    return Array.isArray(coord) ? { lat: coord[1], lon: coord[0] } : null;
  } catch (error: unknown) {
    console.warn('[Geo] adres opzoeken mislukt:', error);
    return null;
  }
}

/**
 * Bouwt een vierkantje rond een gevaarlijke plek. OpenRouteService wil polygonen
 * om te mijden; een cirkel benaderen met een vierkant is hier nauwkeurig genoeg
 * en houdt het verzoek klein.
 */
function verbodenVlak(plek: GevaarlijkePlek): number[][] {
  const dLat = plek.straalMeters / 111320;
  const dLon = plek.straalMeters / (111320 * Math.cos((plek.lat * Math.PI) / 180));
  return [
    [plek.lon - dLon, plek.lat - dLat],
    [plek.lon + dLon, plek.lat - dLat],
    [plek.lon + dLon, plek.lat + dLat],
    [plek.lon - dLon, plek.lat + dLat],
    [plek.lon - dLon, plek.lat - dLat],
  ];
}

/** Eén aanwijzing onderweg: "Sla linksaf op de Magriethof". */
export interface RouteStap {
  tekst: string;
  afstandMeters: number;
}

export interface RouteResultaat {
  /** Punten van de lijn op de kaart. */
  lijn: Punt[];
  afstandMeters: number;
  duurSeconden: number;
  /** Volgorde waarin de stops bezocht moeten worden. */
  volgorde: number[];
  /** Stap voor stap de weg, in het Nederlands. */
  stappen: RouteStap[];
  fout?: string;
}

/**
 * Berekent de veiligste fietsroute van A naar B, zonder terugweg. Gebruikt voor
 * het kaartje bij een los adres, zodat Jayce daar meteen de weg ziet.
 */
export async function berekenRit(
  van: Punt,
  naar: Punt,
  teMijden: GevaarlijkePlek[] = []
): Promise<RouteResultaat> {
  return vraagRouteOp([van, naar], teMijden);
}

/**
 * Berekent de veiligste fietsroute langs alle stops en terug naar het begin.
 * Gebruikt het fietsprofiel, dat fietspaden kiest en drukke wegen mijdt.
 */
export async function berekenRoute(
  start: Punt,
  stops: Punt[],
  teMijden: GevaarlijkePlek[]
): Promise<RouteResultaat> {
  if (stops.length === 0) {
    return { lijn: [], afstandMeters: 0, duurSeconden: 0, volgorde: [], stappen: [] };
  }
  // Heen langs alle stops en weer terug naar huis.
  return vraagRouteOp([start, ...stops, start], teMijden);
}

/**
 * Het werk zelf: één verzoek aan de routedienst met een reeks punten.
 *
 * De stops gaan in de volgorde waarin ze worden meegegeven. De dienst kende ooit
 * een parameter om die volgorde te optimaliseren, maar die bestaat niet meer en
 * levert nu "Unknown parameter" op, waardoor het hele verzoek faalt. Wil je de
 * slimste volgorde, dan is daar het aparte optimalisatie-eindpunt voor.
 */
async function vraagRouteOp(
  punten: Punt[],
  teMijden: GevaarlijkePlek[]
): Promise<RouteResultaat> {
  const leeg: RouteResultaat = {
    lijn: [],
    afstandMeters: 0,
    duurSeconden: 0,
    volgorde: [],
    stappen: [],
  };

  if (!ORS_SLEUTEL) return { ...leeg, fout: 'Er is nog geen kaartsleutel ingesteld.' };
  if (punten.length < 2) return leeg;

  const coordinaten = punten.map((p) => [p.lon, p.lat]);

  const body: Record<string, unknown> = {
    coordinates: coordinaten,
    // De aanwijzingen in het Nederlands, want Jayce leest ze onderweg.
    instructions: true,
    language: 'nl',
  };

  if (teMijden.length > 0) {
    body.options = {
      avoid_polygons: {
        type: 'MultiPolygon',
        coordinates: teMijden.map((plek) => [verbodenVlak(plek)]),
      },
    };
  }

  try {
    const response = await fetch(`${ORS_BASIS}/v2/directions/${ORS_PROFIEL}/geojson`, {
      method: 'POST',
      headers: { Authorization: ORS_SLEUTEL, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const melding = data?.error?.message || `De route kon niet berekend worden (${response.status}).`;
      // Het profiel erbij, anders is bij een profielfout niet te zien welke
      // versie van de app er eigenlijk draait.
      return { ...leeg, fout: `${melding} (profiel: ${ORS_PROFIEL})` };
    }

    const data = await response.json();
    const feature = data?.features?.[0];
    const lijn: Punt[] = (feature?.geometry?.coordinates ?? []).map((c: number[]) => ({
      lat: c[1],
      lon: c[0],
    }));
    const samenvatting = feature?.properties?.summary ?? {};

    // De volgorde die de dienst heeft gekozen. Zonder optimalisatie is dat
    // gewoon de volgorde waarin we ze hebben aangeboden.
    const gekozen: number[] = punten.slice(1, -1).map((_, i) => i);

    // De aanwijzingen zitten per segment; achter elkaar plakken geeft de hele weg.
    const stappen: RouteStap[] = (feature?.properties?.segments ?? []).flatMap(
      (segment: { steps?: { instruction?: string; distance?: number }[] }) =>
        (segment.steps ?? []).map((stap) => ({
          tekst: stap.instruction ?? '',
          afstandMeters: stap.distance ?? 0,
        }))
    );

    return {
      lijn,
      afstandMeters: samenvatting.distance ?? 0,
      duurSeconden: samenvatting.duration ?? 0,
      volgorde: gekozen,
      stappen: stappen.filter((s) => s.tekst),
    };
  } catch (error: unknown) {
    console.warn('[Geo] route berekenen mislukt:', error);
    return { ...leeg, fout: 'De routedienst reageert niet. Probeer het later opnieuw.' };
  }
}
