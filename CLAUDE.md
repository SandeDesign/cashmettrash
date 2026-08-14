# CLAUDE.md voor CashMetTrash

Primaire context voor Claude Code in dit project.

---

## 1. Project

**Naam:** CashMetTrash
**Onderdeel van:** SandeDesign ecosysteem
**Doel:** Buurtservice waarbij Jayce glazen flessen en statiegeld (plastic flessen +
blik) ophaalt bij mensen in de buurt. Werkgebied: Tilburg, rond de Magriethof.
Jayce doet zijn ronde op de skelter.
**Repo:** https://github.com/SandeDesign/cashmettrash
**Hosting:** Vercel

---

## 2. De twee geldstromen (dit moet exact kloppen)

Dit is de kern van het project. De twee stromen mogen nergens door elkaar lopen:
niet in het datamodel, niet in de UI, niet in de security rules.

### Glas
- Alleen glas **zonder** statiegeldlogo: wijnflessen, jampotten, sauspotten. Het
  logo bepaalt de stroom, niet het soort fles. Bierflesjes uit een krat hebben
  wél statiegeld en horen dus bij geen van beide; die laat Jayce staan en levert
  de klant zelf in bij de supermarkt
- Klant meldt zich aan en geeft adres op
- Jayce haalt fysiek op bij de klant
- Klant betaalt **€ 4,99 per ophaalbeurt** via Stripe (eenmalige betaling, niet per fles)
- Geld gaat naar de bedrijfsrekening (Buddy BV), **niet** naar Jayce
- Firestore: `glasOrders`, mét Stripe-velden

### Statiegeld
- Alleen **plastic** flessen en blikjes mét statiegeldlogo, want dat is wat de
  inleverautomaat van Viatim aanneemt
- Klant geeft via de app aan dat er iets klaarstaat, met een schatting van de aantallen
- Aanmelden is gratis
- Jayce verzamelt fysiek en corrigeert de telling; **geen geld loopt via hem**
- Marc haalt wekelijks collectief op bij Jayce en scant in bij Viatim.nl op zijn account
- **Het statiegeld zelf gaat volledig en onaangeroerd naar de klant.** Het bedrag
  komt uit de inleverautomaat via Viatim en kan niet worden aangepast, dus er kan
  ook niets van worden afgetrokken
- Marc plakt de Viatim-Tikkie in de chat; de app zet dat bericht automatisch klaar
- De klant ziet de knop naar die Tikkie **pas nadat de ophaalkosten betaald zijn**.
  Daarvoor staat er een slotje met de betaalknop. De beheerder ziet de link wel
  meteen, want die moet kunnen nakijken wat hij heeft gestuurd
  (`toonTikkieKnop` op `ChatVenster`)
- **Ophaalkosten** van EUR 2,00 staan hier helemaal los van. Die worden achteraf in
  rekening gebracht, tegelijk met de Tikkie, en betaalt de klant via Stripe in de app
- Firestore: `statiegeldLogs`. Bevat wel `servicekosten*`-velden, maar nooit een
  veld dat het statiegeld zelf als betaling behandelt

---

## 3. Rollen

| Rol | Route | Rechten |
|---|---|---|
| `klant` | `/mijn` | Glas aanvragen + betalen, statiegeld aanmelden, ophaalkosten betalen, chatten met de beheerder, eigen gegevens |
| `jayce` | `/jayce`, `/jayce/route`, `/jayce/bekenden`, `/jayce/score` | Aanvragen bevestigen met een tijdslot en daarna afvinken, statiegeld tellen, de route bekijken, bekenden zien, eigen score. **Geen toegang tot de chat.** Het enige bedrag dat hij ziet is zijn eigen potje |
| `moeder` | `/mama`, `/mama/tijden`, `/mama/plekken`, `/mama/ideeen` | Meekijken met de ronde en zien bij welke ritten ze mee moet, de ophaaltijden instellen, gevaarlijke plekken markeren, ideeën doorgeven. Geen orders, geen chat |
| `admin` | `/admin` | Takenlijst, orders, statiegeld afrekenen, chatten met klanten, rollen toewijzen en klanten als bekende aanwijzen (`/admin/klanten`), ophaalronde (`/admin/ophalen`), ophaaltijden (`/admin/tijden`), werkgebied (`/admin/instellingen`), dagoverzicht (`/admin/dagoverzicht`), ideeën (`/admin/ideeen`), cijfers (`/admin/cijfers`), CSV-export |

**Dashboards tonen acties, geen cijfers.** `/admin` en `/mijn` beantwoorden de
vraag "wat moet ik nu doen". Getallen horen op `/admin/cijfers` en `/jayce/score`.

**De pagina's van Jayce zijn geschreven voor een tienjarige.** Korte zinnen, "je"
en "jij", geen woorden als melding, verwerken of status. Rauwe Firebase-fouten
worden daar nooit getoond, altijd een eigen tekst.

Registratie geeft altijd `klant`. De beheerder wijst daarna rollen toe op
`/admin/klanten`; `firestore.rules` staat alleen een admin toe `users.rol` te
wijzigen, en blokkeert rol-escalatie door de gebruiker zelf. De allereerste admin
zet je met de hand in de Firestore-console, want anders kan niemand rollen geven.
Een beheerder kan zijn eigen rol niet aanpassen, zodat de laatste admin niet per
ongeluk verdwijnt.

De navigatie per rol staat in `src/components/layout/navItems.tsx`. Op desktop is
dat de balk onder de header; op mobiel opent `MobielMenu` rechtsonder een paneel
waarin de items per `groep` bij elkaar staan, allemaal uitgeklapt zodat je in één
oogopslag alles ziet; inklappen doe je zelf. Een item met `teller: 'chat'` krijgt
het rode bolletje met het aantal ongelezen berichten, dat ook op de menuknop zelf
verschijnt (`useOngelezen`).

### Bekende

Een bekende is géén aparte rol maar een vlag op de klant (`customers.isBekende`),
die alleen de beheerder via `/admin/klanten` kan zetten. Een bekende:

- mag buiten het werkgebied wonen en toch aanvragen doen
- kan bij het aanmelden kiezen het statiegeld aan Jayce te **schenken**. Dan gaat
  het bedrag naar zijn potje, komt er geen Tikkie en zijn er geen ophaalkosten

### Werkgebied

`instellingen/werkgebied` bepaalt waar we ophalen. Twee dingen los van elkaar:

- **postcodes**: wie daarbuiten woont kan niets aanvragen, tenzij hij bekende is.
  Een lege lijst betekent: iedereen mag
- **maxAfstandMeters**: de buitengrens van de ronde. Verder weg kan niemand iets
  aanvragen, ook niet met mama erbij. Alleen een bekende mag hier overheen
- **straalAlleenMeters + maxItemsAlleen**: Jayce mag alleen op pad binnen de
  straal. Mama moet mee als het adres daarbuiten ligt **én** er minstens
  `maxItemsAlleen` (standaard 30) stuks klaarstaan. Allebei, niet één van beide

De hele toets zit in `src/utils/werkgebied.ts` (`toetsWerkgebied`) en wordt door
de klantpagina's aangeroepen via `useWerkgebiedToets`. Die hook zoekt ontbrekende
coördinaten eenmalig op en bewaart ze meteen, zodat de straalcontrole ook werkt
voor accounts van voor de routeplanner. Zonder `VITE_ORS_API_KEY` kan de app geen
coördinaten opzoeken en blokkeren alleen de postcodes nog; de beheerder ziet daar
een waarschuwing over op `/admin/instellingen`.

### Ophalen inplannen

Aanvragen gaan in twee stappen. Jayce ziet een nieuwe aanvraag in zijn lijst,
drukt op **Ik ga het halen** en kiest een tijdslot. De aanvraag krijgt dan status
`ingepland` met `geplandVan` en `geplandTot`, de klant krijgt een melding en ziet
het moment in zijn overzicht. Pas daarna verschijnt de knop om af te vinken.

De klant **moet** bij het aanmelden een voorkeur kiezen (`voorkeurTijdslotId`,
`voorkeurVan`, `voorkeurTot`); zonder keuze kan hij niet verzenden. Reden: er moet
iemand thuis zijn als Jayce aanbelt. Het blijft wel een wens en geen afspraak:
Jayce ziet hem bovenaan in zijn kiezer met een label, maar mag iets anders kiezen.
De security rules laten de klant alleen de `voorkeur*`-velden zetten, nooit de
`gepland*`-velden. Staan er geen actieve tijdsloten, dan kan er dus ook niets
worden aangevraagd; de klant krijgt dat te zien.

De beheerder volgt dit op `/admin/ophalen`: alles wat op de lijst van Jayce
staat, glas en statiegeld door elkaar, gesplitst in "wacht op Jayce" en
"ingepland". Dat is bewust een aparte pagina, want `/admin/glas` en
`/admin/statiegeld` gaan over de administratie en niet over de ronde zelf. Daar
kan hij een aanvraag ook **verwijderen**, met een bevestiging vooraf; dat is er
voor de testfase en om een misser op te ruimen. De rules staan `delete` alleen
een admin toe.

De tijdsloten staan in `tijdsloten/{id}` en herhalen zich wekelijks: een dag plus
een begin- en eindtijd. Mama beheert ze op `/mama/tijden`, de beheerder op
`/admin/tijden`; het is dezelfde lijst en hetzelfde component. Zijn er geen
actieve tijdsloten, dan kan Jayce niets bevestigen en zegt de app dat ook.

### Rondleiding

Klant, Jayce en mama hebben elk een eigen uitleg in stapjes, met een vraagteken
in de header om hem opnieuw te openen. De eerste keer gaat hij vanzelf open; dat
onthoudt de app in `localStorage` onder `cmt_rondleiding_gezien_{rol}`. De teksten
staan in `src/components/uitleg/rondleidingStappen.tsx`, het venster zelf in
`Rondleiding.tsx`. Een stap kan een `naar` meekrijgen; dan verschijnt er een knop
die de rondleiding sluit en meteen naar die pagina springt. De beheerder heeft
bewust geen rondleiding.

### Route en kaarten

Kaarten staan **in de app zelf**, niet in de kaart-app van de telefoon. Dat is
bewust: op het toestel van Jayce staat schermtijd aan en mag Maps niet open.

`AdresKaart` is de routeplanner naar één adres: kaart met de getekende route,
afstand, reistijd en de aanwijzingen stap voor stap in het Nederlands. Bij Jayce
staat er géén link naar buiten. Mama en de beheerder krijgen die wel, via
`metKaartApp`, want zij rijden met de auto en willen hun eigen navigatie starten.

Het **thuisadres** stel je in op `/admin/instellingen`: vul het adres in, druk op
"Zet de stip op dit adres" en de app zoekt de coördinaten op. Staat dat niet
goed, dan klopt de zwarte stip op alle kaarten niet en rekent de app de afstanden
vanaf het verkeerde punt.

`/jayce/route` tekent de hele ronde met Leaflet en OpenStreetMap-tegels. De
tegels hebben geen sleutel nodig, dus de kaart met genummerde spelden werkt
altijd. Alleen de **lijn** komt van OpenRouteService (profiel `cycling-safe`,
met de plekken van mama als `avoid_polygons`) en heeft `VITE_ORS_API_KEY` nodig.

Diezelfde sleutel zet adressen om naar coördinaten. Zonder sleutel hebben nieuwe
klanten dus geen `lat`/`lon` en valt `AdresKaart` terug op alleen de link naar de
kaart-app. Voor Jayce is de sleutel daarmee in de praktijk verplicht.

---

## 4. Tech stack

- React 18 (SPA, react-router-dom v7, géén Next.js)
- TypeScript strict
- Vite 5
- Tailwind CSS 3 + eigen design system (`src/styles/cmt-theme.css`)
- Zustand 5 (`authStore`, `customerStore`, `glasStore`, `statiegeldStore`,
  `chatStore`, `instellingenStore`)
- Firebase Auth (email/wachtwoord) + Firestore
- Stripe via PHP-proxy op internedata.nl (`/uploads/cashmettrash/`)
- lucide-react (iconen), date-fns (datums)
- Poppins wordt zelf gehost vanuit `public/fonts/`; geen Google Fonts
- Pushmeldingen via Firebase Cloud Messaging, verstuurd door `php/push.php`
- Kaart met Leaflet + react-leaflet en OpenStreetMap-tegels; routes via
  OpenRouteService (`src/utils/geo.ts`). Alleen op de kaartpagina's geladen
- Routes worden lazy geladen met `React.lazy`, met een voortgangsbalk als fallback
- Vercel hosting

---

## 5. Datamodel

```ts
users/{uid}            uid, email, naam, rol, createdAt, updatedAt
customers/{uid}        naam, adres, postcode, plaats, telefoon, email, timestamps
                       isBekende?      // alleen door admin te zetten
                       lat?, lon?      // via OpenRouteService, voor de routeplanner

glasOrders/{orderId}
  customerId, customerNaam, adres, postcode, plaats
  status: 'aangemeld' | 'ingepland' | 'opgehaald' | 'betaald' | 'geannuleerd'
  bedrag: 499                      // vast, in centen, per ophaalbeurt
  stripeSessionId?, stripePaymentIntentId?, stripeStatus?
  aangemaaktOp, betaaldOp?, opgehaaldOp?, jayceId?
  tijdslotId?, geplandVan?, geplandTot?   // gezet door Jayce bij bevestigen
  voorkeurTijdslotId?, voorkeurVan?, voorkeurTot?   // wens van de klant

statiegeldLogs/{logId}
  customerId, customerNaam, adres, postcode, plaats
  items: { plastic, blik }            // schatting door klant
  itemsWerkelijk?: { plastic, blik }  // telling door Jayce
  status: 'aangemeld' | 'ingepland' | 'opgehaald' | 'verwerktBijViatim' | 'tikkieVerstuurd'
  aangemaaktOp, opgehaaldOp?, verwerktOp?, jayceId?
  tijdslotId?, geplandVan?, geplandTot?   // gezet door Jayce bij bevestigen
  voorkeurTijdslotId?, voorkeurVan?, voorkeurTot?   // wens van de klant
  tikkieVerstuurdOp?, tikkieBedrag?, tikkieLink?   // registratie, niet aanpasbaar
  geschonken: boolean                              // alleen een bekende mag dit
  servicekosten: 200 | 0                           // 0 bij een schenking
  servicekostenStatus: 'nietVerschuldigd' | 'openstaand' | 'betaald'
  servicekostenBetaaldOp?, serviceStripeSessionId?, serviceStripeStatus?

chatGesprekken/{customerId}
  customerId, customerNaam, laatsteBericht, laatsteBerichtOp,
  ongelezenKlant, ongelezenAdmin

chatGesprekken/{customerId}/berichten/{id}
  afzender: 'klant' | 'admin', tekst, aangemaaktOp,
  tikkieLink?, statiegeldLogId?     // alleen door admin te zetten

pushTokens/{uid}
  uid, rol, token, bijgewerktOp     // niemand kan hier lezen; alleen push.php

instellingen/werkgebied
  postcodes: string[]               // leeg = overal
  thuisAdres?, thuisPostcode?, thuisPlaats?   // waar de ronde begint
  middelpuntLat, middelpuntLon
  straalAlleenMeters                // zo ver mag Jayce alleen
  maxAfstandMeters                  // hier houdt de ronde op; buiten dit: geblokkeerd
  maxItemsAlleen                    // vanaf dit aantal moet mama mee
  bijgewerktOp

tijdsloten/{slotId}
  dagVanDeWeek: 0-6                 // zoals Date.getDay(), 0 is zondag
  van: "16:00", tot: "17:30"        // herhaalt zich wekelijks
  actief, aangemaaktDoor, aangemaaktOp

gevaarlijkePlekken/{plekId}
  lat, lon, straalMeters, omschrijving, aangemaaktDoor, aangemaaktOp

suggesties/{suggestieId}
  tekst, vanNaam, vanUid, status: 'nieuw' | 'gelezen' | 'gedaan', aangemaaktOp
```

`GLAS_PRIJS_CENTEN = 499` en `STATIEGELD_SERVICE_CENTEN = 200` staan op één plek:
`src/utils/constants.ts`.
Bedragen zijn **altijd in centen** en worden alleen bij weergave geformatteerd met
`formatCenten`.

---

## 6. Design system

Licht en vriendelijk, een buurtservice voor gezinnen en geen premium uitstraling.
Geen dark theme, geen glassmorphism.

| Token | Waarde | Betekenis |
|---|---|---|
| `--cmt-glas` | `#0E8F6C` | groen, **altijd** de glas-flow |
| `--cmt-stat` | `#0B4A9E` | blauw, **altijd** de statiegeld-flow |
| `--cmt-paper` | `#F5F3EE` | achtergrond |
| `--cmt-ink` | `#14181F` | tekst |

Font: Poppins (700 voor headings/CTA's, 400 voor body).

Zet `cmt-flow-glas` of `cmt-flow-stat` op een container; alle `cmt-*`-componenten
daarbinnen nemen automatisch de juiste accentkleur over via `--cmt-accent`.

Componentklassen: `cmt-card` (+ `-flow`, `-tint`), `cmt-btn-primary/secondary/ghost`,
`cmt-badge` (+ `-glas`/`-stat`/`-neutral`/`-done`/`-warning`/`-error`), `cmt-input`,
`cmt-select`, `cmt-textarea`, `cmt-label`, `cmt-table`, `cmt-alert-*`,
`cmt-empty-state`, `cmt-skeleton`, `cmt-spinner`, `cmt-modal*`, `cmt-animate-in`.

---

## 7. PHP-proxy

**Host:** https://internedata.nl/uploads/cashmettrash/

| Endpoint | Doel |
|---|---|
| `checkout.php` | Stripe Checkout-sessie, **alleen `mode: "payment"`** |
| `stripe-proxy.php` | Sessiestatus ophalen na terugkeer |
| `push.php` | Pushmeldingen versturen. Controleert het inlogtoken en zoekt zelf de ontvangers op in `pushTokens` |

Waarom een proxy: de Stripe secret key blijft server-side en CORS wordt omzeild.
Endpoints zijn overschrijfbaar via `VITE_CHECKOUT_URL` / `VITE_STRIPE_PROXY_URL`.

---

## 8. Coderegels

### Verplicht
- `fetch`, nooit axios
- Functionele componenten met hooks
- TypeScript strict; vermijd `any`
- Aantallen invoeren via `AantalVeld` (`src/components/common/`). Nooit een kale
  `<input type="number">` met `Number(x) || 0`: dan springt de nul meteen terug
  zodra je het veld leegmaakt en kun je er niets meer in typen
- Tailwind-utilities + `cmt-*` classes; `style` alleen voor dynamische waarden en
  CSS-variabelen
- **Cascade-valkuil:** `cmt-theme.css` wordt ná Tailwind geladen, dus een
  `cmt-*`-klasse wint bij gelijke specificiteit. De `cmt-btn-*`-klassen zetten zelf
  `display: inline-flex`, waardoor Tailwinds `hidden` er geen effect op heeft. Zet
  responsive verbergen daarom op een wrapper-element, niet op de knop zelf
- Zustand voor data-state
- Firestore voor alle data; geen eigen backend
- Alle UI-tekst in het Nederlands
- Datums formatteren met `date-fns` + locale `nl`
- Betalingen uitsluitend via de PHP-proxy
- Bedragen in centen

### Verboden
- Geen Next.js, geen SSR
- Geen nieuwe npm-packages zonder overleg
- Geen Stripe SDK client-side
- Geen abonnementen of SEPA-machtigingen, alleen eenmalige betalingen
- **Nooit** het statiegeldbedrag zelf als betaling behandelen. Dat komt uit Viatim,
  is niet aanpasbaar en gaat volledig naar de klant. De `servicekosten` staan daar los van
- **Nooit** bedragen tonen in het Jayce-dashboard, en Jayce nooit toegang tot de
  chat geven. Eén uitzondering: op `/jayce/score` staat zijn eigen potje, want dat
  is geld dat aan hem is geschonken
- Geen analytics, trackers of third-party scripts. Kaart en route lopen wél langs
  OpenStreetMap en OpenRouteService; dat staat zo in de privacyverklaring en in
  het cookiebeleid, en gebeurt alleen op de kaartpagina's van Jayce, mama en de
  beheerder. Een klant haalt nooit iets bij een derde partij op
- Geen externe fonts of CDN's toevoegen, om dezelfde reden

### Naamgeving
- Componenten en pagina's: PascalCase
- Functies/variabelen: camelCase, Nederlandstalig waar het de domeinlogica raakt
- Firestore-collecties: camelCase (`glasOrders`, `statiegeldLogs`)
- CSS-classes: `cmt-` prefix

---

## 9. Environment variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Web Push-certificaat; zonder deze sleutel blijft de meldingenknop verborgen
VITE_FIREBASE_VAPID_KEY=

# Optioneel
VITE_CHECKOUT_URL=
VITE_STRIPE_PROXY_URL=
VITE_PUSH_URL=

# Gratis sleutel van openrouteservice.org. Zonder sleutel blijft de kaart werken,
# maar tekent de app geen route.
VITE_ORS_API_KEY=
```

Ingesteld in Vercel bij Settings > Environment Variables. Er staan geen hardcoded
fallbacks meer in `src/lib/firebase.ts`.

**Nooit committen en nooit in Vercel:** de Stripe secret key. Die staat alleen in
`checkout.php` op internedata.nl.

---

## 10. Publieke pagina's

Naast de landingspagina zijn deze routes publiek en lazy geladen:

| Route | Inhoud |
|---|---|
| `/installeren` | PWA-installatie-uitleg, herkent het platform en vangt `beforeinstallprompt` op. Ben je ingelogd, dan krijgt dezelfde pagina de omlijsting van je eigen rol en staat hij in het menu als "Op je telefoon" |
| `/voorwaarden` | Algemene voorwaarden |
| `/privacy` | Privacyverklaring |
| `/cookies` | Cookiebeleid, bewust in kindvriendelijke taal |
| `/herroeping` | Herroepingsrecht, hoort bij het verplichte vinkje in `GlasAanvraag` |
| `/disclaimer` | Disclaimer |

De header van de publieke pagina's heeft één menuknop rechtsboven
(`PubliekMenu`) in plaats van losse knoppen; daar zitten inloggen, aanmelden en
alle publieke pagina's met een icoon in.

Bedrijfsgegevens staan op één plek: `src/utils/bedrijf.ts`. Zolang die niet zijn
ingevuld tonen de juridische pagina's een waarschuwing.

Het opstartscherm staat inline in `index.html` en wordt door `src/main.tsx`
verwijderd. Dat moet daar blijven staan: in React zou het te laat komen en zie je
alsnog een witte flits.

---

## 11. Openstaand / TODO

- [ ] Geen e-mailnotificaties in v1, bevestigingsmails zijn bewust uitgesteld
- [ ] Tikkie-koppeling is handmatig: je plakt bedrag en link uit Viatim, de app
      deelt ze in de chat. Geen Viatim- of Tikkie-API in v1
- [ ] Meldingen worden verstuurd door het apparaat dat de handeling doet. Sluit
      iemand de app te snel, dan kan een melding wegvallen. Een Cloud Function
      die op Firestore luistert zou dat oplossen, maar vereist het Blaze-plan
- [ ] Ophaalkosten worden achteraf geïnd. Betaalt een klant niet, dan blijft de
      melding op 'openstaand' staan; er is geen automatische herinnering
- [ ] Geen unit- of E2E-tests
- [ ] Stripe-webhook zou de betaalstatus betrouwbaarder maken dan de huidige
      controle bij terugkeer uit Checkout

---

## 12. Commando's

```bash
npm run dev          # dev-server op poort 5173
npm run build        # productiebuild
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run preview
```

---

*Laatst bijgewerkt: 2026-08-12*
