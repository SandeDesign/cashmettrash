# VlottrGG Setup voor Bolt.new

Complete handleiding voor het deployen van VlottrGG via Bolt.new met Stripe en Supabase integratie.

## 🚀 Snelstart

### Optie A: Bolt's Native Stripe (Aanbevolen voor beginners)
Bolt.new heeft ingebouwde Stripe ondersteuning. Gebruik deze optie als je snel wilt starten zonder Supabase edge functions te deployen.

**Voordelen**:
- Sneller te implementeren
- Minder configuratie nodig
- Bolt beheert de Stripe integratie

**Nadelen**:
- Minder controle over payment flow
- Mogelijk beperktere customization

### Optie B: Custom Supabase Edge Functions (Aanbevolen voor production)
Volledige controle met Supabase edge functions voor Stripe payments.

**Voordelen**:
- Volledige controle over payment logic
- Flexibele customization
- Beter voor complexe flows
- Subscription management

**Nadelen**:
- Iets meer setup werk
- Vereist Supabase project

---

## 📋 Optie A: Bolt Native Stripe Setup

### Stap 1: Import Project in Bolt.new
1. Ga naar https://bolt.new
2. Upload je VlottrGG project of gebruik git import
3. Wacht tot Bolt het project analyseert

### Stap 2: Voeg Stripe toe
In de Bolt.new chat, typ:
```
Add Stripe payments to this application for the car rental subscriptions
```

Bolt zal automatisch:
- Stripe checkout integratie toevoegen
- Publishable key configuratie opzetten
- Payment flows implementeren

### Stap 3: Configureer Environment Variables
In Bolt.new settings, voeg toe:

```env
# Firebase
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender
VITE_FIREBASE_APP_ID=your-app-id

# Stripe (via Bolt's interface)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stap 4: Test
1. Run de app in Bolt.new preview
2. Registreer een test account
3. Probeer een auto te boeken
4. Test met Stripe test card: `4242 4242 4242 4242`

---

## 🔧 Optie B: Supabase Edge Functions Setup

### Stap 1: Supabase Project aanmaken
1. Ga naar https://supabase.com
2. Maak nieuw project: "VlottrGG"
3. Kies regio (Amsterdam voor EU)
4. Wacht op project provisioning (~2 minuten)

### Stap 2: Stripe Secret Key configureren
1. Ga naar https://dashboard.stripe.com/test/apikeys
2. Kopieer de "Secret key" (begint met `sk_test_`)
3. In Supabase:
   - Ga naar Project Settings > Edge Functions
   - Add secret: `STRIPE_SECRET_KEY` = `sk_test_...`

### Stap 3: Deploy Edge Functions

#### Via Supabase CLI (lokaal):
```bash
# Installeer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
cd supabase/functions
supabase functions deploy create-subscription-checkout
supabase functions deploy create-checkout-session
supabase functions deploy retrieve-session
```

#### Via Bolt.new:
In de Bolt chat, typ:
```
Deploy the Supabase edge functions in /supabase/functions/ to my Supabase project
```

### Stap 4: Environment Variables (Bolt.new)
```env
# Firebase
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender
VITE_FIREBASE_APP_ID=your-app-id

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stap 5: Test Edge Functions
Test de deployed functions:

```bash
# Test create-subscription-checkout
curl -X POST https://your-project.supabase.co/functions/v1/create-subscription-checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 7000,
    "productName": "Test Auto",
    "productDescription": "€70 per week, minimaal 4 weken",
    "customerEmail": "test@example.com",
    "bookingId": "test_123",
    "carId": "car_123",
    "successUrl": "http://localhost:5173/bookings?success=true",
    "cancelUrl": "http://localhost:5173/cars?canceled=true"
  }'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "session_id": "cs_test_..."
}
```

---

## 🔄 Migratie van Custom Proxy naar Supabase

Als je al een custom proxy gebruikt en wilt migreren:

### Stap 1: Deploy Supabase Functions
Volg "Optie B: Stap 2-3" hierboven

### Stap 2: Update Environment Variables
Voeg toe (behoud oude proxies voor fallback):
```env
VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
```

### Stap 3: Test
De app zal automatisch Supabase functions gebruiken als `VITE_SUPABASE_FUNCTIONS_URL` is ingesteld, anders valt het terug op de oude proxy URLs.

### Stap 4: Cleanup (optioneel)
Als alles werkt, verwijder de oude proxy environment variables:
```env
# Niet meer nodig:
# VITE_STRIPE_CHECKOUT_PROXY_URL=...
```

---

## 📸 Upload Proxy Setup

Voor foto uploads (auto's, rijbewijs, profiel):

### Via Interne Data Proxy
Upload de proxy handler code naar je interne data systeem:

**Code is beschikbaar in**: `/docs/upload-proxy-handler.js` (gegenereerd in eerdere conversatie)

**Folder structuur**:
- Auto fotos: `vlottr/auto's/{kenteken}/`
- Rijbewijs: `vlottr/users/{uid}/rijbewijs/`
- Profiel: `vlottr/users/{uid}/profiel/`

**Environment variable**:
```env
VITE_UPLOAD_PROXY_URL=https://your-internal-proxy.com/upload
```

---

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Registratie werkt met Firebase
- [ ] Login/logout werkt
- [ ] Auto lijst toont beschikbare auto's
- [ ] Datepicker toont alleen maandagen
- [ ] Bezette data worden uitgesloten
- [ ] Booking modal opent correct

### Stripe Testing (Test Mode)
- [ ] Checkout redirect werkt
- [ ] Test card acceptatie: `4242 4242 4242 4242`
- [ ] Success URL redirect werkt
- [ ] Cancel URL redirect werkt
- [ ] Booking status update in Firebase
- [ ] Subscription wordt aangemaakt in Stripe

### Test Cards (Stripe)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Authentication Required: 4000 0025 0000 3155
```

---

## 🚨 Troubleshooting

### "Stripe configuratie niet gevonden"
**Oplossing**:
- Check of `VITE_SUPABASE_FUNCTIONS_URL` of `VITE_STRIPE_CHECKOUT_PROXY_URL` is ingesteld
- Herstart de dev server na env variable wijzigingen

### "CORS error" bij Supabase functions
**Oplossing**:
- Check of de Supabase anon key correct is
- Verify dat CORS headers in edge functions aanwezig zijn (zie `/supabase/functions/_shared/stripe.ts`)

### "Bedrag verplicht (min 100 cent)"
**Oplossing**:
- Check of amount in cents wordt verstuurd (7000 voor €70)
- Verify dat de edge function de `amount` field correct ontvangt

### Subscription wordt niet aangemaakt
**Oplossing**:
- Check Stripe logs in dashboard
- Verify dat `mode: 'subscription'` is ingesteld
- Check of price recurring interval correct is

---

## 📚 Aanvullende Documentatie

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Bolt.new Documentation](https://bolt.new/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

## 🎯 Production Checklist

Voor live deployment:

### Stripe
- [ ] Switch van test naar live keys
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` naar `pk_live_...`
- [ ] Update `STRIPE_SECRET_KEY` in Supabase naar `sk_live_...`
- [ ] Activeer webhooks in Stripe dashboard
- [ ] Test met echte betaalkaart (kleine bedrag)

### Firebase
- [ ] Schakel Firebase Security Rules in
- [ ] Enable alleen noodzakelijke sign-in methods
- [ ] Setup email verification
- [ ] Configure password policies

### Supabase
- [ ] Review edge function logs
- [ ] Setup monitoring/alerts
- [ ] Enable rate limiting
- [ ] Review database RLS policies

### General
- [ ] Setup custom domain
- [ ] SSL certificaat actief
- [ ] Privacy policy pagina
- [ ] Terms of service pagina
- [ ] GDPR compliance check
- [ ] Backup strategie

---

## 💡 Tips

1. **Development**: Gebruik altijd Stripe test mode keys tijdens development
2. **Logging**: Check browser console en Stripe dashboard logs voor debugging
3. **Testing**: Test edge functions lokaal met `supabase functions serve`
4. **Security**: Bewaar nooit secret keys in frontend code
5. **Performance**: Supabase edge functions zijn sneller dan custom proxies
6. **Monitoring**: Setup Stripe webhooks voor subscription lifecycle events

---

## 🆘 Support

- Stripe issues: https://support.stripe.com
- Supabase issues: https://github.com/supabase/supabase/discussions
- Firebase issues: https://firebase.google.com/support
- VlottrGG specifiek: Contacteer de ontwikkelaar

---

**Laatst bijgewerkt**: 2026-02-13
**Versie**: 2.0 (Bolt.new compatible)
