# CashMetTrash opzetten

Vier stappen: Firebase, PHP-proxy, Vercel, rollen.

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

## 3. Vercel

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
   ```

   Optioneel, alleen als je naar een andere proxy-map wilt wijzen:

   ```
   VITE_CHECKOUT_URL
   VITE_STRIPE_PROXY_URL
   ```

   Laat je die leeg, dan gebruikt de app `https://internedata.nl/uploads/cashmettrash/…`.

3. Zet het productiedomein in Firebase bij **Authentication > Settings >
   Geautoriseerde domeinen**, anders weigert Firebase Auth in te loggen.

> Let op: alles met een `VITE_`-prefix komt in de browserbundle terecht. Zet daar
> nooit de Stripe secret key in, die hoort in `checkout.php`.

---

## 4. Rollen instellen

Iedereen die zich registreert krijgt de rol `klant`. De security rules staan niet
toe dat een gebruiker zijn eigen rol wijzigt, dus `jayce` en `admin` zet je
handmatig:

1. Laat Jayce en jezelf normaal registreren via `/registreren`.
2. Open in de Firebase Console **Firestore > `users`**.
3. Zoek het document met de juiste `email` en wijzig het veld `rol`:
   - jouw account → `admin`
   - Jayce → `jayce`
4. Uitloggen en opnieuw inloggen; je komt nu op `/admin` respectievelijk `/jayce`.

Het bijbehorende `customers`-document mag blijven staan; het wordt voor deze
rollen simpelweg niet gebruikt.

---

## 5. Logo-assets vervangen

In `public/` staan tijdelijke placeholders. Overschrijf deze bestanden met de
definitieve assets. De bestandsnamen zijn al goed, er hoeft niets in de code te
veranderen:

| Bestand | Formaat |
|---|---|
| `icon-192.png` | 192 × 192 PNG, maskable (houd het beeldmerk binnen de middelste 80%) |
| `icon-512.png` | 512 × 512 PNG, maskable |
| `favicon.png` | 64 × 64 PNG |
| `logo.svg` | transparant, voor de header |

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
