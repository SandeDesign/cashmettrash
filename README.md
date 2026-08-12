# CashMetTrash

Buurtservice waarbij Jayce glazen flessen en statiegeld ophaalt bij mensen in de
buurt. Werkgebied: Tilburg, rond de Magriethof. Jayce doet zijn ronde op de skelter.

## Twee gescheiden geldstromen

Deze scheiding is de kern van de app en loopt door het datamodel, de UI en de
Firestore security rules heen.

| | **Glas** (groen) | **Statiegeld** (blauw) |
|---|---|---|
| Klant doet | Ophaalbeurt aanvragen | Aantallen aanmelden |
| Betalen bij aanmelden | € 4,99 via Stripe | Niets, aanmelden is gratis |
| Betalen achteraf | Niets | € 2,00 ophaalkosten via Stripe |
| Klant ontvangt | Niets | Het volledige statiegeld via Tikkie |
| Jayce | Haalt op, ziet geen bedragen | Haalt op, telt, ziet geen bedragen |
| Firestore | `glasOrders` | `statiegeldLogs` |

Het statiegeld zelf gaat volledig en onaangeroerd naar de klant. Marc haalt
wekelijks collectief op bij Jayce en scant het in bij Viatim.nl; het bedrag komt
uit de inleverautomaat en kan niet worden aangepast, dus er kan ook niets van
worden afgetrokken. Marc plakt de Viatim-Tikkie in de chat, waarna de app hem
automatisch bij de klant aflevert met een betaallink voor de ophaalkosten.

## Rollen

| Rol | Route | Kan |
|---|---|---|
| `klant` | `/mijn` | Glas aanvragen + betalen, statiegeld aanmelden, ophaalkosten betalen, chatten |
| `jayce` | `/jayce` | Ophaaltaken zien en afvinken, statiegeld tellen. Geen bedragen, geen chat |
| `admin` | `/admin` | Alles: orders, statiegeld-log, Tikkie delen, chatten, CSV-export |

Registratie geeft altijd de rol `klant`. `jayce` en `admin` worden handmatig in de
Firestore-console gezet. De security rules blokkeren dat een gebruiker zichzelf
een andere rol geeft.

## Stack

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS 3 · Zustand 5 ·
Firebase Auth + Firestore · Stripe via PHP-proxy op internedata.nl · Vercel

## Commando's

```bash
npm install
npm run dev         # dev-server op poort 5173
npm run typecheck   # tsc --noEmit
npm run lint
npm run build       # productiebuild naar dist/
npm run preview
```

## Opzetten

Zie [SETUP.md](./SETUP.md) voor Firebase, de PHP-proxy, Vercel-omgevingsvariabelen
en het instellen van de rollen.

## Structuur

```
src/
├── App.tsx                     routes + rolbewaking
├── components/
│   ├── chat/ChatVenster.tsx
│   ├── common/                 Toast, CmtModal, StatusBadge, CollapsibleSection
│   ├── guards/RoleGuard.tsx
│   ├── landing/HeroIllustratie.tsx
│   ├── layout/                 AppLayout, PublicHeader, navItems
│   └── shared/                 ErrorBoundary, Loading, Logo, ScrollToTop
├── hooks/useAuth.ts
├── lib/                        firebase, configCheck
├── pages/
│   ├── Landing.tsx             publieke landingspagina op /
│   ├── Installeren.tsx         PWA-installatie-uitleg
│   ├── juridisch/              Voorwaarden, Privacy, Cookies,
│   │                           Herroeping, Disclaimer
│   ├── Login.tsx · Registreren.tsx · GeenToegang.tsx
│   ├── klant/                  Overzicht, GlasAanvraag, StatiegeldMelden,
│   │                           BetalingGelukt, BetalingGeannuleerd, Chat, Profiel
│   ├── jayce/Taken.tsx
│   └── admin/                  Overzicht, GlasOrders, StatiegeldLog,
│                               Gesprekken, Gesprek
├── store/                      authStore, customerStore, glasStore,
│                               statiegeldStore, chatStore
├── styles/cmt-theme.css        design system
├── types/index.ts
└── utils/                      constants, stripe, csv, validation, errorLogger
```

## Design

Licht en vriendelijk, geen dark theme. Poppins. Kleur draagt betekenis:
groen `#0E8F6C` is altijd glas, blauw `#0B4A9E` is altijd statiegeld.
Papier `#F5F3EE`, inkt `#14181F`.

Een sectie krijgt de juiste accentkleur via `cmt-flow-glas` of `cmt-flow-stat`
op een container; alle `cmt-*`-componenten daarbinnen volgen automatisch.

## Coderegels

- `fetch`, nooit axios
- Functionele componenten met hooks
- Zustand voor data-state; geen Redux
- Tailwind-utilities + `cmt-*` classes uit `cmt-theme.css`; geen inline styles voor layout
- Alle UI-tekst in het Nederlands
- Betalingen uitsluitend via de PHP-proxy, nooit de Stripe SDK client-side
- Bedragen altijd in centen, één keer geformatteerd met `formatCenten`
- Geen em-streepjes in teksten; gebruik gewone interpunctie
- Geen analytics, trackers of externe fonts. De juridische pagina's beweren dat er
  niets naar derden gaat, en dat moet waar blijven
