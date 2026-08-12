# CashMetTrash

Buurtservice waarbij Jayce glazen flessen en statiegeld ophaalt bij mensen in de buurt.

## Twee gescheiden geldstromen

Deze scheiding is de kern van de app en loopt door het datamodel, de UI en de
Firestore security rules heen.

| | **Glas** (groen) | **Statiegeld** (blauw) |
|---|---|---|
| Klant doet | Ophaalbeurt aanvragen | Aantallen aanmelden |
| Betaling in de app | € 4,99 per ophaalbeurt via Stripe | Geen |
| Geld gaat naar | Bedrijfsrekening (Buddy BV) | Klant, via Tikkie |
| Wie regelt het geld | Stripe | Marc, buiten de app om |
| Jayce | Haalt op, ziet geen bedragen | Haalt op, telt, ziet geen bedragen |
| Firestore | `glasOrders` (met Stripe-velden) | `statiegeldLogs` (zonder betaalvelden) |

Statiegeld-workflow buiten de app: Marc haalt wekelijks collectief op bij Jayce,
scant het in bij Viatim.nl op zijn eigen account, en stuurt de klant rechtstreeks
een Tikkie. In de app wordt dat alleen handmatig afgevinkt.

## Rollen

| Rol | Route | Kan |
|---|---|---|
| `klant` | `/mijn` | Glas aanvragen + betalen, statiegeld aanmelden, eigen overzicht |
| `jayce` | `/jayce` | Ophaaltaken zien en afvinken, statiegeld tellen. Geen bedragen |
| `admin` | `/admin` | Alles: orders, statiegeld-log, Tikkie markeren, CSV-export |

Registratie geeft altijd de rol `klant`. `jayce` en `admin` worden handmatig in de
Firestore-console gezet — de security rules blokkeren dat een gebruiker zichzelf
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
│   ├── common/                 Toast, CmtModal, StatusBadge, CollapsibleSection
│   ├── guards/RoleGuard.tsx
│   ├── layout/                 AppLayout, navItems
│   └── shared/                 ErrorBoundary, Loading, Logo, ScrollToTop
├── hooks/useAuth.ts
├── lib/firebase.ts
├── pages/
│   ├── klant/                  Overzicht, GlasAanvraag, StatiegeldMelden,
│   │                           BetalingGelukt, BetalingGeannuleerd, Profiel
│   ├── jayce/Taken.tsx
│   └── admin/                  Overzicht, GlasOrders, StatiegeldLog
├── store/                      authStore, customerStore, glasStore, statiegeldStore
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
