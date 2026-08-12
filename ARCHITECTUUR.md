# VlottrGG - Technische Architectuur

## 🏗️ Systeem Overzicht

VlottrGG gebruikt een gescheiden architectuur voor verschillende functionaliteiten:

### 1. **Upload Systeem** (PHP Proxy)
Voor alle bestandsuploads (foto's)

### 2. **Stripe Betalingen** (Supabase Edge Functions)
Voor alle betalingsgerelateerde functies

### 3. **Firebase** (Database & Auth)
Voor gebruikersbeheer en data opslag

---

## 📸 Upload Systeem

### Proxy Locatie
```
https://internedata.nl/proxyvlottr.php
```

### Verantwoordelijk voor
- ✅ Auto foto uploads
- ✅ Rijbewijs foto uploads (voor/achter)
- ✅ Profiel foto uploads

### Folder Structuur
```
/uploads/vlottr/
├── auto's/
│   └── {kenteken}/
│       ├── foto1.jpg
│       ├── foto2.jpg
│       └── ...
└── users/
    └── {uid}/
        ├── rijbewijs/
        │   ├── front.jpg
        │   └── back.jpg
        └── profiel/
            └── profile.jpg
```

### Request Format (FormData)
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('folder', 'vlottr/users/{uid}/rijbewijs');
formData.append('filename', 'front.jpg');

fetch('https://internedata.nl/proxyvlottr.php', {
  method: 'POST',
  body: formData
});
```

### Response Format
```json
{
  "success": true,
  "url": "https://internedata.nl/uploads/vlottr/users/{uid}/rijbewijs/front.jpg",
  "fileUrl": "https://internedata.nl/uploads/vlottr/users/{uid}/rijbewijs/front.jpg",
  "filename": "front.jpg",
  "path": "/uploads/vlottr/users/{uid}/rijbewijs/front.jpg"
}
```

### Frontend Implementatie
```typescript
// src/utils/upload.ts
import { uploadLicensePhotos, uploadCarPhotos, uploadProfilePhoto } from './upload';

// Rijbewijs upload
const result = await uploadLicensePhotos(
  frontImageFile,
  backImageFile,
  userId,
  'https://internedata.nl/proxyvlottr.php'
);

// Auto fotos upload
const results = await uploadCarPhotos(
  imageFiles,
  kenteken,
  'https://internedata.nl/proxyvlottr.php'
);

// Profiel foto upload
const result = await uploadProfilePhoto(
  imageFile,
  userId,
  'https://internedata.nl/proxyvlottr.php'
);
```

---

## 💳 Stripe Betalingen

### **GEEN PROXY** - Direct via Supabase Edge Functions

### Verantwoordelijk voor
- ✅ Stripe checkout sessies aanmaken
- ✅ Subscription beheer (€70/week)
- ✅ Payment status ophalen

### Supabase Edge Functions
```
/supabase/functions/
├── create-subscription-checkout/
│   └── index.ts
├── create-checkout-session/
│   └── index.ts
└── retrieve-session/
    └── index.ts
```

### Request Format (JSON)
```javascript
// Direct naar Supabase edge function - GEEN PHP proxy!
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/create-subscription-checkout',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      amount: 7000, // €70 in cents
      productName: 'BMW 3 Serie - Wekelijks Abonnement',
      productDescription: '€70 per week, minimaal 4 weken',
      customerEmail: 'user@example.com',
      bookingId: 'booking_123',
      carId: 'car_123',
      successUrl: 'https://vlottr.nl/bookings?success=true',
      cancelUrl: 'https://vlottr.nl/cars?canceled=true'
    })
  }
);
```

### Response Format
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

### Frontend Implementatie
```typescript
// src/utils/stripe.ts
import { createSubscriptionCheckout } from './stripe';

// Stripe checkout - gebruikt Supabase edge function (GEEN PHP proxy!)
const result = await createSubscriptionCheckout({
  priceAmount: 70,
  productName: `${car.brand} ${car.model}`,
  customerEmail: user.email,
  bookingId: booking.id,
  carId: car.id,
  successUrl: `${window.location.origin}/bookings?success=true`,
  cancelUrl: `${window.location.origin}/cars?canceled=true`
  // GEEN proxyUrl parameter - gebruikt automatisch Supabase!
});
```

---

## 🔥 Firebase

### Verantwoordelijk voor
- ✅ Gebruikers authenticatie (registratie, login)
- ✅ Database (Firestore):
  - Users collectie
  - Cars collectie
  - Bookings collectie
  - Settings collectie

### Collections Schema

#### `users`
```typescript
{
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: 'customer' | 'manager' | 'admin';
  verification_status: 'pending' | 'approved' | 'rejected';
  driver_license?: {
    front_image_url: string; // URL van upload proxy
    back_image_url?: string; // URL van upload proxy
    verified: boolean;
  };
}
```

#### `cars`
```typescript
{
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  images: string[]; // URLs van upload proxy
  status: 'available' | 'rented' | 'maintenance';
  weekly_rate: 70;
}
```

#### `bookings`
```typescript
{
  id: string;
  car_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  weekly_rate: 70;
  stripe_session_id?: string; // Van Supabase edge function
  stripe_subscription_id?: string; // Van Stripe webhook
  subscription_status: 'pending' | 'active' | 'cancelled';
}
```

---

## 🔄 Data Flow

### Upload Flow (Rijbewijs)
```
User selects foto
     ↓
Frontend (uploadLicensePhotos)
     ↓
PHP Proxy (internedata.nl/proxyvlottr.php)
     ↓
File saved: /uploads/vlottr/users/{uid}/rijbewijs/front.jpg
     ↓
Response: { url: "https://..." }
     ↓
Frontend updates Firebase user.driver_license.front_image_url
```

### Booking + Payment Flow
```
User clicks "Huur nu"
     ↓
Frontend creates Firestore booking (status: 'pending')
     ↓
Frontend calls createSubscriptionCheckout()
     ↓
Supabase Edge Function (create-subscription-checkout)
     ↓
Stripe API (create subscription checkout session)
     ↓
Response: { url: "https://checkout.stripe.com/..." }
     ↓
Frontend redirects user to Stripe checkout
     ↓
User completes payment
     ↓
Stripe redirects to successUrl
     ↓
Frontend updates Firestore booking (status: 'confirmed')
```

---

## 🌐 Environment Variables

### Frontend (.env)
```bash
# Firebase
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# Supabase (voor Stripe payments)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_SUPABASE_FUNCTIONS_URL=https://xxx.supabase.co/functions/v1

# Upload Proxy (voor foto's)
VITE_UPLOAD_PROXY_URL=https://internedata.nl/proxyvlottr.php
```

### Supabase Edge Functions
```bash
# In Supabase Dashboard > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_test_xxx  # of sk_live_xxx voor productie
```

---

## ⚠️ Belangrijke Opmerkingen

### ❌ NIET DOEN
- ❌ Stripe payments via PHP proxy
- ❌ Base64 encoding voor uploads (PHP verwacht FormData!)
- ❌ Upload proxy URL in Stripe calls
- ❌ Stripe secret key in frontend code

### ✅ WEL DOEN
- ✅ Uploads ALLEEN via PHP proxy (FormData)
- ✅ Stripe ALLEEN via Supabase edge functions
- ✅ Alle secrets in backend (Supabase edge functions)
- ✅ CORS headers in beide proxies

---

## 🔒 Security

### Upload Proxy (PHP)
- ✅ CORS headers voor toegestane origins
- ✅ Bestandstype validatie (alleen images)
- ✅ Bestandsgrootte limiet (10MB)
- ✅ Path traversal preventie
- ✅ Filename sanitization

### Stripe (Supabase)
- ✅ Secret key alleen in edge function env
- ✅ CORS headers
- ✅ Request validatie
- ✅ Amount validatie (min 100 cents)

### Firebase
- ✅ Security Rules voor Firestore
- ✅ Authentication required voor protected routes
- ✅ Role-based access control (RBAC)

---

## 📊 Monitoring

### Logs Check Locaties
1. **Upload issues**: PHP server logs + browser console
2. **Stripe issues**: Supabase edge function logs + Stripe Dashboard
3. **Firebase issues**: Firebase Console > Firestore + Authentication
4. **Frontend errors**: Browser console

---

## 🚀 Deployment Checklist

- [ ] PHP upload proxy deployed en bereikbaar
- [ ] Supabase project aangemaakt
- [ ] Supabase edge functions deployed
- [ ] STRIPE_SECRET_KEY in Supabase secrets
- [ ] Firebase project geconfigureerd
- [ ] Environment variables ingesteld in frontend
- [ ] CORS geconfigureerd in alle services
- [ ] Test uploads (rijbewijs, auto, profiel)
- [ ] Test Stripe checkout flow
- [ ] Test booking creation in Firebase

---

**Versie**: 2.0
**Laatst bijgewerkt**: 2026-02-13
**Architect**: VlottrGG Development Team
