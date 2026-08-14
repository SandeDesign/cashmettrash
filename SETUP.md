# CashMetTrash opzetten

Zes stappen: Firebase, PHP-proxy, meldingen, Vercel, rollen, bedrijfsgegevens.

---

## 1. Firebase

### 1.1 Project aanmaken

1. Ga naar de [Firebase Console](https://console.firebase.google.com/) en maak een
   nieuw project aan, bijvoorbeeld `cashmettrash`.
2. **Build > Authentication > Sign-in method**: zet **E-mailadres/wachtwoord** aan.
3. **Build > Firestore Database**: maak een database aan in **productiemodus**,
   regio `europe-west4` (Nederland).

### 1.2 Web-app registreren

**Projectinstellingen (tandwiel) > Je apps > Web-app toevoegen**. Na het aanmaken
krijg je een `firebaseConfig`-blok te zien. Daaruit heb je zes waarden nodig:

| Uit `firebaseConfig` | Omgevingsvariabele |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Lokaal zet je die in een `.env` (kopieer `.env.example`). In Vercel zet je ze bij
**Settings > Environment Variables**, zie stap 3.

Deze waarden zijn niet geheim; ze worden afgeschermd door de security rules.

### 1.3 Security rules publiceren

De rules staan in `firestore.rules`. Publiceren kan op twee manieren:

**Via de console:** Firestore Database > Regels > plak de inhoud van
`firestore.rules` > Publiceren.

**Via de CLI:**

```bash
npm i -g firebase-tools
firebase login
firebase use --add          # kies het cashmettrash-project
firebase deploy --only firestore:rules
```

### 1.4 Indexen

Firestore vraagt bij het eerste gebruik zelf om samengestelde indexen. De
foutmelding in de console bevat een directe aanmaaklink. Klik die aan bij:

- `glasOrders`: `customerId` (asc) + `aangemaaktOp` (desc)
- `glasOrders`: `status` (asc) + `aangemaaktOp` (asc)
- `statiegeldLogs`: `customerId` (asc) + `aangemaaktOp` (desc)
- `statiegeldLogs`: `status` (asc) + `aangemaaktOp` (asc)

De chat heeft geen samengestelde index nodig.

---

## 2. PHP-proxy

De Stripe secret key staat **uitsluitend** op de server, nooit in deze repo en
nooit in Vercel.

1. Maak op internedata.nl de map `/uploads/cashmettrash/`.
2. Kopieer `checkout.php` en `stripe-proxy.php` uit `/uploads/vlottr/` naar die map.
3. Vervang in beide bestanden de Stripe secret key door die van het
   CashMetTrash-account (of hergebruik het bestaande account als je dat wilt).

`checkout.php` moet een POST met dit JSON-lichaam aankunnen:

```json
{
  "mode": "payment",
  "amount": 499,
  "currency": "eur",
  "productName": "Ophaalbeurt glas",
  "customerEmail": "klant@example.nl",
  "orderId": "<firestore doc id>",
  "success_url": "https://…/betaling/gelukt?order=…&session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://…/betaling/geannuleerd?order=…",
  "metadata": { "order_id": "…", "flow": "glas" }
}
```

en antwoordt met `{ "url": "https://checkout.stripe.com/…", "session_id": "cs_…" }`.

Verschillen met de Vlottr-versie:

- **Alleen `mode: "payment"`.** Geen subscription-tak, geen `price_id`, geen
  `payment_method_types: ["sepa_debit"]`.
- `amount` is **altijd in centen** en wordt server-side niet meer omgerekend.
- `bookingId` heet nu `orderId`.

`stripe-proxy.php` blijft ongewijzigd: POST `{ "sessionId": "cs_…" }`, antwoord
met minimaal `payment_status`.

Zorg dat beide bestanden CORS toestaan voor het productiedomein.

---

## 3. Pushmeldingen

Meldingen lopen via Firebase Cloud Messaging. De app kan die niet zelf versturen,
daar is een servicesleutel voor nodig, dus dat doet `push.php` op internedata.nl.

### 3.1 Sleutels ophalen

1. Firebase Console > Projectinstellingen > **Cloud Messaging** > Web-configuratie
   > **Sleutelpaar genereren**. Kopieer die sleutel naar Vercel als
   `VITE_FIREBASE_VAPID_KEY`. Zonder deze sleutel blijft de knop om meldingen aan
   te zetten verborgen.
2. Projectinstellingen > **Serviceaccounts** > Nieuwe persoonlijke sleutel
   genereren. Je krijgt een JSON-bestand.

### 3.2 push.php plaatsen

1. Zet `php/push.php` uit deze repo in `/uploads/cashmettrash/`.
2. Zet het JSON-bestand uit stap 1.2 ernaast als `service-account.json`.
3. Vul bovenin `push.php` je Firebase project-id in bij `PROJECT_ID`.
4. Schermd het JSON-bestand af met een `.htaccess` in dezelfde map:

   ```apache
   <Files "service-account.json">
     Require all denied
   </Files>
   ```

   Controleer daarna dat `https://internedata.nl/uploads/cashmettrash/service-account.json`
   een foutmelding geeft en niet het bestand.

`push.php` controleert bij elke aanroep het inlogtoken van de gebruiker, zoekt
zelf op welke apparaten bij de rol horen, en verstuurt de melding. De app krijgt
nooit tokens van andere gebruikers te zien.

### 3.3 Waar het aan staat

Iedereen zet meldingen zelf aan via het kaartje op zijn eigen pagina. Op een
iPhone of iPad kan dat pas als de app op het beginscherm staat; dat is een regel
van Apple, en de app legt het uit.

---

## 4. Vercel

1. Koppel de repo aan een Vercel-project. Framework wordt herkend als **Vite**;
   build command `npm run build`, output `dist`. Dat staat al in `vercel.json`.
2. **Settings > Environment Variables**: zet voor **Production, Preview én
   Development**:

   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_VAPID_KEY
   ```

   En voor de routeplanner:

   ```
   VITE_ORS_API_KEY
   ```

   Die sleutel haal je gratis op bij [openrouteservice.org](https://openrouteservice.org):
   maak een account, ga naar **Dashboard > Request a token**, kies het profiel
   *Standaard* en geef de token een naam. Het gratis tarief is ruim voldoende voor
   een ronde per dag. Zonder sleutel blijft de kaart gewoon werken, maar tekent de
   app geen route.

   Optioneel, alleen als je naar een andere proxy-map wilt wijzen:

   ```
   VITE_CHECKOUT_URL
   VITE_STRIPE_PROXY_URL
   VITE_PUSH_URL
   ```

   Laat je die leeg, dan gebruikt de app `https://internedata.nl/uploads/cashmettrash/…`.

3. Zet het productiedomein in Firebase bij **Authentication > Settings >
   Geautoriseerde domeinen**, anders weigert Firebase Auth in te loggen.

> Let op: alles met een `VITE_`-prefix komt in de browserbundle terecht. Zet daar
> nooit de Stripe secret key in, die hoort in `checkout.php`.

---

## 5. Rollen instellen

Iedereen die zich registreert krijgt de rol `klant`. De security rules staan niet
toe dat een gebruiker zijn eigen rol wijzigt, dus de eerste beheerder zet je met de
hand:

1. Registreer jezelf normaal via `/registreren`.
2. Open in de Firebase Console **Firestore > `users`**.
3. Zoek het document met jouw `email` en zet het veld `rol` op `admin`.
4. Uitloggen en opnieuw inloggen; je komt nu op `/admin`.

Dat is de enige keer dat je in de console hoeft te zijn. Alle andere rollen deel je
daarna uit in de app zelf, op **/admin/klanten**: laat Jayce en zijn moeder normaal
registreren en kies bij hun naam de rol *Jayce* of *Moeder*. Ze moeten daarna wel
even uit- en opnieuw inloggen.

Je eigen rol staat op slot, zodat je jezelf niet per ongeluk kunt degraderen en de
app zonder beheerder achterblijft.

Het bijbehorende `customers`-document mag blijven staan; het wordt voor deze
rollen simpelweg niet gebruikt.

### Bekenden aanwijzen

Een bekende is een klant die dicht bij Jayce staat. Die vlag zet je op dezelfde
pagina **/admin/klanten**, met het vinkje *Bekende van Jayce* naast de rol. Dat
vinkje verschijnt alleen bij mensen met de rol klant. Een bekende mag buiten het
werkgebied wonen en kan zijn statiegeld aan Jayce schenken.

### Werkgebied instellen

Op **/admin/instellingen** stel je in:

- de **postcodes** waar we ophalen. Wie daarbuiten woont kan niets aanvragen,
  tenzij hij bekende is. Laat je het leeg, dan blokkeert deze regel niets
- het **startpunt** van de ronde
- de **groene cirkel**: zo ver mag Jayce alleen op pad
- de **blauwe cirkel**: hier houdt de ronde op. Wie daarbuiten woont kan niets
  aanvragen, ook niet met mama erbij. Alleen een bekende mag hier overheen
- het **aantal stuks** vanaf wanneer mama mee moet. Dat geldt pas als het adres
  óók buiten de groene cirkel ligt

> Let op: de controle op afstand werkt alleen met `VITE_ORS_API_KEY` ingesteld,
> want de app moet het adres eerst kunnen omzetten naar coördinaten. Zonder die
> sleutel blokkeren alleen de postcodes. De pagina waarschuwt daar zelf over.

### Ophaaltijden instellen

Jayce kan een aanvraag pas bevestigen als er tijden klaarstaan. Zet ze neer op
**/admin/tijden** (of laat zijn moeder dat doen op **/mama/tijden**, het is
dezelfde lijst): kies een dag en een begin- en eindtijd, bijvoorbeeld woensdag
16:00 tot 17:30. Een tijd herhaalt zich elke week.

Zet een tijd tijdelijk op *uit* als het een week niet uitkomt. Hij blijft dan
bewaard, maar Jayce kan hem niet kiezen.

---

## 6. Bedrijfsgegevens invullen

De juridische pagina's staan er, maar zijn nog niet compleet: de gegevens van de
rechtspersoon ontbreken. Zolang dat zo is tonen alle juridische pagina's zichtbaar
een waarschuwing, zodat het niet ongemerkt live gaat.

Vul ze in op één plek, in `src/utils/bedrijf.ts`:

| Veld | Wat | Status |
|---|---|---|
| `kvk` | KvK-nummer van Buddy BV | ingevuld |
| `btw` | Btw-identificatienummer | ingevuld |
| `adres` | Straat en huisnummer van de vestiging | ingevuld |
| `postcode` | Postcode van de vestiging | ingevuld |
| `plaats` | Vestigingsplaats. Let op: dit is Geleen en niet het werkgebied | ingevuld |
| `email` | Adres waar privacyverzoeken en klachten binnenkomen | aanbevolen |
| `telefoon` | Optioneel | |

De waarschuwing bovenaan de juridische pagina's noemt zelf welk veld nog
ontbreekt, dus je ziet vanzelf wanneer je klaar bent.

> Zonder `email` valt de app terug op het postadres als contactadres, en
> verdwijnt de waarschuwing. Bij verkoop op afstand hoort er wel een e-mailadres
> bij de bedrijfsgegevens te staan, dus vul het aan zodra je er een hebt.

Werk daarna ook `laatstBijgewerkt` bij. Die datum staat onderaan elke juridische
pagina.

Loop de teksten zelf een keer door voordat de app publiek gaat. Ze zijn geschreven
op basis van wat de app feitelijk doet, maar een jurist heeft er niet naar gekeken.

---

## 7. Logo-assets

De definitieve assets staan in `public/` en hoeven niet meer vervangen te worden:

| Bestand | Gebruik |
|---|---|
| `logo.svg` | Beeldmerk in de header. Het karakter staat hier bewust groter in de ring dan in het volledige logo, want op 28 px is de originele verhouding niet meer te lezen |
| `icon-192.png`, `icon-512.png` | App-icoon en og:image, `purpose: "any"` |
| `icon-maskable-192.png`, `icon-maskable-512.png` | App-icoon voor Android, `purpose: "maskable"`. Zonder de blauwe ring, want die wordt door de cirkelcrop toch afgesneden |
| `favicon.png` | Browsertab, 64 × 64 |

Het volledige logo met wordmerk zit als React-component in
`src/components/shared/LogoLockup.tsx` en staat op de landingspagina. Dat is
bewust inline SVG en geen `<img>`: een SVG die via een img-tag wordt geladen haalt
geen externe fonts op, waardoor het wordmerk in een verkeerd lettertype zou
verschijnen.

### PNG's opnieuw genereren

Wijzigt `logo.svg` ooit, dan moeten de vier PNG's opnieuw worden gerenderd. Er zit
geen build-stap voor in het project; het is een losse handeling met headless
Chromium. Vraag Claude Code erom, of gebruik een tool naar keuze en houd deze
formaten aan:

- `icon-512.png`, `icon-192.png`, `favicon.png`: de badge uit `logo.svg`, met
  transparante achtergrond
- `icon-maskable-*.png`: hetzelfde karakter zonder badge-cirkel en zonder ring, op
  een `#EAF6F1` vlak, op ongeveer 80% van het canvas zodat alles binnen de veilige
  zone van de cirkelcrop blijft

---

## Controleren of alles werkt

1. Registreer een klant → controleer in Firestore dat er een `users/{uid}` met
   `rol: "klant"` én een `customers/{uid}` staat.
2. Vraag als klant een glas-ophaalbeurt aan → Stripe Checkout moet openen met
   € 4,99 in **payment mode** (geen abonnement, geen SEPA-machtiging).
3. Meld statiegeld aan → controleer dat het `statiegeldLogs`-document **geen enkel**
   Stripe- of bedrag-veld bevat.
4. Log in als Jayce → beide taken staan gescheiden, nergens een bedrag te zien,
   de navigatieknop opent het juiste adres.
5. Log in als admin → schatting en telling staan naast elkaar; "Verwerkt bij
   Viatim" en "Tikkie verstuurd" werken; CSV-export opent in Excel.
