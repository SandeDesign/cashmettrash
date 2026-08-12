# CLAUDE.md — VlottrGG

Dit bestand is de primaire context voor Claude Code in dit project.

---

## 1. Project Overview

**Naam:** VlottrGG (Vlottr)
**Onderdeel van:** SandeDesign ecosysteem
**Doel:** Autoverhuurplatform voor Zuid-Limburg — klanten huren wekelijks auto's via abonnementen (SEPA Direct Debit), managers beheren vloot en boekingen, admins beheren het hele systeem. Partners (garages/dealers) kunnen auto's aanmelden.
**Status:** In ontwikkeling
**URL:** https://vlottr.eu
**Repo:** https://github.com/SandeDesign/VlottrGG

---

## 2. Tech Stack

**Frontend:**
- Framework: React 18 (SPA, geen Next.js — client-side routing via react-router-dom v7)
- Taal: TypeScript (strict)
- Styling: Tailwind CSS 3.4 + eigen design system (`vlottr-theme.css` met CSS custom properties)
- UI Library: Eigen componenten + Lucide React icons
- Build tool: Vite 5.4

**Backend / Serverless:**
- Firebase Auth (email/password authenticatie)
- Firebase Firestore (database — collections: `users`, `cars`, `bookings`, `contracts`, `settings`, `notifications`, `chat_conversations`, `chat_messages`, `sent_emails`, `activity_logs`, `waitlist`, `rental_car_inspections`, `email_templates`, `partner_contracts`)
- Firebase Storage (niet actief — uploads gaan via PHP proxy)
- PHP proxy op eigen host — URL: https://internedata.nl/uploads/vlottr/
- Make.com webhooks (registratie triggers)
- Stripe via PHP proxy (SEPA Direct Debit subscriptions + eenmalige betalingen)

**State Management:** Zustand 5 (stores: `authStore`, `bookingStore`, `carStore`, `chatStore`, `contractStore`, `settingsStore`, `notificationStore`, `partnerStore`, `activityLogStore`, `rentalCarInspectionStore`, `waitlistStore`, `emailTemplatesStore`, `appStore`)

**Extra libraries:**
- `jspdf` + `html2canvas` — PDF generatie (contracten)
- `react-signature-canvas` — Digitale handtekeningen
- `react-quill` — Rich text editor (e-mail templates, CMS)
- `tesseract.js` — OCR voor rijbewijs scanning
- `dompurify` — HTML sanitization
- `date-fns` — Datumformattering

**Hosting:**
- Frontend: Netlify (of vergelijkbaar — Vite SPA)
- PHP proxy: internedata.nl (eigen host)

**Authenticatie:** Firebase Auth (email/password) met role-based access (customer, manager, admin, partner)

---

## 3. Projectstructuur

```
VlottrGG/
├── src/
│   ├── App.tsx                # Hoofdrouting — alle routes + role guards
│   ├── main.tsx               # Entry point — React render + CSS imports
│   ├── components/
│   │   ├── activity/          # ActivityFeed, ActivityAnalytics
│   │   ├── admin/             # DriverLicenseModal, UserValidation
│   │   ├── auth/              # LoginForm, RegisterForm, SimpleRegisterForm, PartnerRegisterForm, MultiStepRegisterForm
│   │   ├── booking/           # BookingModal, BookingDetailModal, PickupModal, ReturnModal, PhotoUploadModal, DeadlineTimer, ExtensionConfirmModal, LockPeriodModal, SuspendBookingModal
│   │   ├── car/               # WaitlistModal
│   │   ├── chat/              # ChatModal, FloatingChat
│   │   ├── common/            # Toast, VlottrModal
│   │   ├── contract/          # ContractViewer, ContractSignedModal, SignaturePad
│   │   ├── customer/          # MaintenanceAlert
│   │   ├── guards/            # RoleGuard, VerificationGuard
│   │   ├── inspection/        # InspectionFormModal, InspectionDetailModal, InspectionStatusBadge, PhotoUploadStep, PhotoUploadTabs, RentalCarInspectionForm, RentalCarInspectionWizard
│   │   ├── layout/            # Header, Sidebar, BottomNav, PublicHeader, NotificationBell, AdminNotificationBell, SupportMenu
│   │   ├── manager/           # CarFormModal, AlternativeCarsModal, AlternativeProposalModal, NotifyDateModal
│   │   ├── onboarding/        # OnboardingTrigger, TourOverlay
│   │   ├── profile/           # DriverLicenseUpload, SalarySlipUpload
│   │   ├── seo/               # SEO, StructuredData
│   │   └── shared/            # ErrorBoundary, Loading, Logo, ScrollToTop
│   ├── contexts/              # ChatModalContext, ModalContext, OnboardingContext
│   ├── data/                  # customerTour.ts, managerTour.ts (onboarding tour steps)
│   ├── hooks/                 # useAuth, useAdminBadges, useVlottrModal
│   ├── lib/                   # firebase.ts (Firebase init + config)
│   ├── pages/
│   │   ├── Landing.tsx        # Publieke landingspagina
│   │   ├── PartnerLanding.tsx # Partner-worden pagina
│   │   ├── VoorKlanten.tsx    # Info pagina klanten
│   │   ├── HoeHetWerkt.tsx    # Uitleg pagina
│   │   ├── Onboarding.tsx     # Klant onboarding wizard
│   │   ├── PendingApproval.tsx # Wachtpagina na registratie
│   │   ├── PWAInstallGuide.tsx # PWA installatie instructies
│   │   ├── Unauthorized.tsx   # 403 pagina
│   │   ├── admin/             # Dashboard, Users, Bookings, Inspections, Settings, ContractSettings, Contracts, Statistics, Chat, ChatManagement, EmailTool, Partners, UserVerification, CMS
│   │   ├── customer/          # Dashboard, Cars, Bookings, Profile, Contracts, ContractSigning, Chat, QuickBook, QuickBookMultiple, GaragePage, SOSPage, Documents, PaymentSuccess, PaymentCancel, BorgPaymentSuccess, DeliveryPaymentSuccess
│   │   ├── manager/           # Dashboard, Cars, Bookings, Customers, Reports, Contracts, ContractDetail, Statistics, Inspections, InspectionForms, ProcessPickup, ProcessReturn, CarMaintenance, WaitlistManagement
│   │   ├── partner/           # Dashboard, Cars, BusinessProfile, Documents, Onboarding, Werkplaats
│   │   ├── legal/             # TermsOfService, PrivacyPolicy, CookiePolicy
│   │   ├── seo/               # AutoHurenLimburg, GoedkoopAutoHuren
│   │   ├── shared/            # FAQ, Debug
│   │   └── Handleiding*.tsx   # Handleidingen voor Admin, Manager, Klant
│   ├── store/                 # Zustand stores (zie sectie 2)
│   ├── styles/
│   │   └── vlottr-theme.css   # Vlottr Design System (CSS variables, componenten)
│   ├── types/
│   │   └── index.ts           # Alle TypeScript interfaces (User, Car, Booking, Contract, etc.)
│   └── utils/
│       ├── activityLogger.ts  # Activity log helpers
│       ├── dateHelpers.ts     # Datum utilities
│       ├── email.ts           # E-mail verzenden via PHP proxy
│       ├── errorLogger.ts     # Global error handlers
│       ├── inspectionFormTemplates.ts  # Inspectieformulier templates
│       ├── logger.ts          # Login/logout logging
│       ├── pdf.ts             # PDF generatie + contract template
│       ├── stripe.ts          # Stripe Checkout + Subscription via PHP proxy
│       ├── upload.ts          # File upload via PHP proxy
│       └── validation.ts      # Formulier validatie + Firebase error messages
├── public/                    # Statische assets
├── index.html                 # SPA entry
├── vite.config.ts             # Vite config met code splitting (react, firebase, ui vendors)
├── tailwind.config.js         # Tailwind config (standaard, geen custom theme extensions)
├── tsconfig.json              # TypeScript project references
├── tsconfig.app.json          # App TypeScript config
└── tsconfig.node.json         # Node TypeScript config
```

---

## 4. Functionele Beschrijving

### Wat doet deze app?
Vlottr is een autoverhuurplatform gericht op Zuid-Limburg. Klanten kunnen wekelijks auto's huren via SEPA Direct Debit abonnementen. Het platform ondersteunt het volledige verhuurproces: registratie met identiteitsverificatie (rijbewijs + OCR), boeking, contract ondertekening, ophalen/inleveren met foto-inspecties, betalingen (Stripe), en wachtlijstbeheer. Er zijn vier rollen: klant, manager, admin, en partner (garages/dealers die auto's aanmelden).

### Hoofdfunctionaliteiten
- **Klant registratie & verificatie** — Registratie, onboarding wizard, rijbewijs upload + OCR verificatie (Tesseract.js), loonstroken upload, admin goedkeuring
- **Auto's bekijken & boeken** — Auto catalogus, plantype selectie (basis €140/w, half jaar €105/w, jaar €85/w), ophalen of bezorgen keuze, wachtlijst als auto bezet is
- **Betalingen** — Stripe Checkout via PHP proxy, SEPA Direct Debit subscriptions, borg (waarborgsom €500), bezorgkosten (€25), betaallinks via e-mail
- **Contracten** — HTML contract generatie vanuit template, digitale handtekening (react-signature-canvas), PDF download (jspdf + html2canvas), beëindigingsovereenkomst bij retour
- **Ophalen & Inleveren** — Foto-inspectieformulieren (4 tabs: hoeken, wielen, interieur, schade), kilometerstand, brandstofniveau, technische staat, extras check
- **Chat** — Real-time chat tussen klant en admin/manager via Firestore
- **E-mail systeem** — E-mails versturen/ontvangen via PHP proxy, templates met variabelen, IMAP inbox voor admin
- **Partner portaal** — Garages/dealers registreren, bedrijfsprofiel, auto's aanmelden met inkoopprijs, partnerovereenkomst tekenen, werkplaats beheer
- **Admin dashboard** — Gebruikersbeheer, boekingenbeheer, contractinstellingen, statistieken, CMS, activity logs, debug tools
- **Manager dashboard** — Vlootbeheer (auto's toevoegen/bewerken), boekingen verwerken, ophalen/inleveren afhandelen, klantenbeheer, rapportages, onderhoud & APK tracking
- **Notificaties** — In-app notificaties via Firestore, e-mail notificaties via PHP proxy
- **Wachtlijst** — Klanten op wachtlijst zetten voor bezette auto's, automatische notificatie bij beschikbaarheid
- **SEO pagina's** — Landingspagina's voor "auto huren Limburg" en "goedkoop auto huren"
- **PWA ondersteuning** — Installeerbaar als Progressive Web App, safe area support voor iOS

### Gebruikersflow (klant)
1. Klant registreert account (naam + e-mail + wachtwoord)
2. Make.com webhook wordt getriggerd, welkomstmail wordt verstuurd
3. Klant doorloopt onboarding wizard: persoonlijke gegevens, rijbewijs upload, loonstroken
4. Admin/manager verifieert rijbewijs (OCR + handmatige check) en keurt account goed
5. Klant bekijkt beschikbare auto's en kiest een plan (basis/half jaar/jaar)
6. Klant kiest ophalen of bezorgen, betaalt via Stripe (SEPA)
7. Contract wordt gegenereerd, klant tekent digitaal
8. Bij ophalen: foto-inspectie + kilometerstand door manager
9. Na huurperiode: retour inspectie, beëindigingsovereenkomst, borg terugbetaling

### Wat doet de app NIET?
- Geen directe betalingsverwerking — alles loopt via PHP proxy naar Stripe
- Geen eigen e-mailserver — PHP proxy op internedata.nl verzorgt SMTP
- Geen GPS/tracking van voertuigen
- Geen automatische schade-detectie (foto's worden handmatig beoordeeld)
- Geen multi-tenancy — één verhuurder (Vlottr/Buddy BV)

---

## 5. Visuele Beschrijving

**Kleurenschema:**
- Primair (groen): `#22c55e` (green-500), accent: `#4ade80` (green-400)
- Achtergrond primair: `#0a0a0a`
- Achtergrond secondary: `#111111`
- Achtergrond elevated: `#1a1a1a`
- Tekst primair: `#ffffff`
- Tekst secondary: `#d4d4d4`
- Tekst muted: `#737373`
- Borders: `rgba(255, 255, 255, 0.1)`
- Error: `#ef4444`, Warning: `#f97316`, Info: `#3b82f6`, Yellow: `#eab308`

**Typografie:**
- Display font: Outfit (Google Fonts) — gewichten: 300, 400, 500, 600, 700, 800, 900
- Mono font: Space Mono (Google Fonts) — gewichten: 400, 700
- Gebruik: `var(--vl-font-display)` en `var(--vl-font-mono)`

**Design stijl:** Dark theme, glassmorphism-elementen (subtiele shine op cards), noise texture overlay, premium feel. Eigen design system via CSS custom properties (`--vl-*` prefix).

**Componenten aanwezig:**
- [x] Navigatie: Sidebar (desktop) + BottomNav (mobile) + PublicHeader
- [x] Dashboard / overzichtspagina (per rol)
- [x] Formulieren (registratie, boeking, auto toevoegen, inspectie)
- [x] Modals / Dialogs (VlottrModal, BookingModal, ChatModal, etc.)
- [x] Tabellen / Lijsten (auto's, boekingen, gebruikers, contracten)
- [x] PDF generatie / download (contracten, beëindigingsovereenkomsten)
- [x] Chat systeem
- [x] Handtekening pad
- [x] Foto upload met preview
- [x] Toast notificaties
- [x] Onboarding tour overlay
- [x] Status badges (vl-badge-green, vl-badge-red, etc.)
- [x] Skeleton loading states
- [x] Error boundaries

**Responsive:** Ja — mobile-first. BottomNav voor mobiel, Sidebar voor desktop. Safe area support voor iOS PWA.

---

## 6. Make.com Integraties

| Scenario naam | Trigger | Doel | Webhook URL |
|---|---|---|---|
| Klant registratie | HTTP webhook (POST) | Notificatie bij nieuwe klant registratie | `https://hook.eu2.make.com/u325jx4udma3ya9oso47nl5qo9xd5ews` |

**Payload structuur:**

```json
// Klant registratie webhook
{
  "type": "customer_registration",
  "firstName": "Jan",
  "email": "jan@example.com",
  "uid": "firebase_uid_here",
  "created_at": "2026-01-15T10:30:00.000Z"
}
```

---

## 7. PHP Proxy / Eigen Host

**Host:** https://internedata.nl/

| Endpoint | Methode | Doel |
|---|---|---|
| `/uploads/vlottr/checkout.php` | POST | Stripe Checkout sessie aanmaken (payment + subscription mode, SEPA Direct Debit) |
| `/uploads/vlottr/stripe-proxy.php` | POST | Stripe sessie status ophalen |
| `/proxyvlottr.php` | POST | File uploads (auto foto's, rijbewijzen, profielfoto's, inspectie foto's, loonstroken) |
| `/uploads/vlottr/mail/send.php` | POST | E-mail verzenden via SMTP (HTML emails) |

**Upload folder structuur op server:**
- Auto's: `/uploads/vlottr/autos/{kenteken}/`
- Rijbewijs: `/uploads/vlottr/{userId}/`
- Profielfoto: `/uploads/vlottr/{userId}/profiel/`
- Inspectie: `/uploads/vlottr/{Ophalen|Inleveren}/users/{userId}/`
- Loonstroken: `/uploads/vlottr/{userId}/loonstroken/`

**Waarom PHP proxy:**
- Stripe API keys verbergen (secret key alleen server-side)
- CORS omzeilen voor Stripe API calls
- SMTP e-mail versturen (niet mogelijk vanuit browser)
- File uploads met server-side opslag
- SEPA Direct Debit vereist server-side sessie aanmaak

---

## 8. Coding Regels voor dit Project

> Claude Code houdt zich ALTIJD aan deze regels, ook als een andere aanpak "logischer" lijkt.

### Verplicht:
- Gebruik altijd `fetch`, nooit axios
- Componenten zijn altijd functional components met hooks
- TypeScript — vermijd `any` waar mogelijk (sommige bestaande code gebruikt `Record<string, any>`)
- CSS via Tailwind utility classes + eigen `vl-*` CSS classes uit `vlottr-theme.css`
- State management via Zustand stores — geen Redux, geen Context voor data (Context alleen voor UI state zoals modals)
- Firebase Firestore voor alle data — geen lokale backend/API
- Alle tekst in het Nederlands (UI, foutmeldingen, comments mogen Engels)
- Datums formatteren met `date-fns`
- Alle uploads via PHP proxy op internedata.nl, nooit direct Firebase Storage
- Alle betalingen via PHP proxy naar Stripe, nooit direct Stripe SDK client-side

### Verboden:
- Geen Next.js — dit is een Vite SPA met react-router-dom
- Geen nieuwe npm packages zonder overleg
- Geen axios — alleen fetch
- Geen inline styles voor layout (gebruik Tailwind) — `style` alleen voor dynamische waarden
- Geen directe Stripe SDK calls vanuit de browser
- Geen server-side rendering (SSR) — dit is een client-side SPA

### Naamgeving:
- Componenten: PascalCase (bestanden + exports)
- Functies/variabelen: camelCase
- Bestanden: PascalCase voor componenten/pages, camelCase voor utils/hooks/stores
- CSS classes: Tailwind utilities + `vl-*` prefix voor design system classes
- Firestore collections: snake_case (`rental_car_inspections`, `chat_messages`, etc.)
- TypeScript interfaces: PascalCase (`User`, `Booking`, `AppSettings`)
- Store hooks: `use{Name}Store` patroon

### Role-based routing:
- `/dashboard`, `/cars`, `/bookings`, `/profile`, `/contracts`, `/chat` — customer
- `/manager/*` — manager + admin
- `/admin/*` — admin only (sommige routes ook manager)
- `/partner/*` — partner only
- Beschermd via `<RoleGuard allowedRoles={[...]}>` wrapper

---

## 9. Environment Variables

```env
# Frontend (Vite — VITE_ prefix vereist)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Fallback waarden staan hardcoded in src/lib/firebase.ts
# Firebase API keys zijn veilig om publiek te zijn (beschermd door Security Rules)

# Nooit committen:
# - Stripe secret keys (staan alleen op PHP proxy server)
# - SMTP credentials (staan alleen op PHP proxy server)
# - Make.com webhook URLs (staan hardcoded in authStore — niet ideaal)
```

---

## 10. Bekende Issues / TODO

- [ ] Make.com webhook URL staat hardcoded in `authStore.ts` — verplaatsen naar env of settings
- [ ] Console.log statements in productie code (upload.ts, email.ts) — opschonen
- [ ] Firebase API keys staan als fallback hardcoded in `firebase.ts`
- [ ] Sommige types gebruiken `Record<string, any>` — kan strikter
- [ ] E-mail templates bevatten inline HTML strings in TypeScript — apart bestand overwegen
- [ ] Geen unit tests aanwezig
- [ ] Geen E2E tests aanwezig

---

## 11. SandeDesign Ecosysteem Context

Dit project is onderdeel van een breder ecosysteem. Gerelateerde projecten:

| Project | Doel | Relatie |
|---|---|---|
| Facto | Facturatie voor freelancers | Zelfde tech stack patroon |
| Bindra | Contract signing | Zelfde contract/handtekening patronen |
| Uitgaaf | Budgettering | Geen directe relatie |
| Agendi | Agenda/planning | Geen directe relatie |
| Vlottr | Auto verhuur Zuid-Limburg | **Dit project** |

**Gedeelde patronen in het ecosysteem:**
- Make.com als automation laag
- PHP proxy op internedata.nl voor server-side calls
- React/TypeScript als frontend standaard
- Firebase als backend (Auth + Firestore)
- Zelfde GitHub workflow (SandeDesign org)
- Dark theme design taal
- Zustand voor state management

---

## 12. Commando's

```bash
# Development
npm run dev          # Start dev server op poort 5173

# Build
npm run build        # Productie build via Vite

# Lint
npm run lint         # ESLint check

# Type check
npm run typecheck    # TypeScript type check (tsc --noEmit)

# Preview
npm run preview      # Preview productie build
```

---

*Gegenereerd via CLAUDE.md basis template — SandeDesign*
*Laatst bijgewerkt: 2026-03-07*
