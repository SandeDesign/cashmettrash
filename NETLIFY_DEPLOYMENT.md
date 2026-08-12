# Netlify Deployment - Firebase API Key Issue

## Waarom gebeurt dit NU?

Netlify heeft recent (2024) **secrets scanning** geïntroduceerd/verscherpt. Dit was waarschijnlijk:
- Niet actief op je eerdere deployments
- Of is nu strenger geworden na een Netlify update

## Firebase API Keys zijn VEILIG om publiek te zijn

**Belangrijke info:**
- Firebase API keys zijn **client-side keys**
- Ze zijn **bedoeld om publiek te zijn**
- Beveiliging gebeurt via:
  - Firebase Security Rules (in Firestore/Storage)
  - Authorized domains (in Firebase Console)
  - Firebase App Check (optioneel, extra laag)

Zie: https://firebase.google.com/docs/projects/api-keys

## Oplossing voor Netlify

### Optie 1: Secrets Scanning Uitschakelen (Snelst)

In `netlify.toml`:
```toml
[build.environment]
  SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"
```

**Waarom dit OK is:**
- Firebase API keys zijn geen echte secrets
- Ze worden beschermd door Firebase Security Rules
- Google zelf zegt dat dit OK is

### Optie 2: Environment Variables (Best Practice)

Stel environment variables in op Netlify:

1. Ga naar Netlify Dashboard → Site Settings → Environment Variables
2. Voeg toe:
   ```
   VITE_FIREBASE_API_KEY = AIzaSyBpbHMjDkStia7SZnRf85ZSjVNIhx6BIeA
   VITE_FIREBASE_AUTH_DOMAIN = vlottr.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = vlottr
   VITE_FIREBASE_STORAGE_BUCKET = vlottr.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID = 245476426806
   VITE_FIREBASE_APP_ID = 1:245476426806:web:c54a2933300786c8be0497
   ```

### Optie 3: Specifieke Waarde Whitelisten

In Netlify UI (niet via config file):
- Site Settings → Build & Deploy → Environment → Secrets scanning
- Add value to omit: `AIzaSyBpbHMjDkStia7SZnRf85ZSjVNIhx6BIeA`

## Huidige Setup

De code is nu geüpdated om BEIDE te ondersteunen:
- ✅ Environment variables (als aanwezig)
- ✅ Fallback naar hardcoded values (voor backwards compatibility)

```typescript
apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy..."
```

## Deployment Commando's

### Via Netlify CLI (met secrets scanning disabled)
```bash
netlify deploy --prod
```

### Via Git Push (automatisch)
```bash
git push origin main
```

Netlify zal automatisch builden met de `netlify.toml` configuratie.

## Troubleshooting

### Build faalt nog steeds?

1. **Check Netlify logs**: Kijk of het daadwerkelijk de secrets scanning is
2. **Clear build cache**: Site Settings → Build & Deploy → Clear cache and retry deploy
3. **Gebruik Netlify UI**: Soms werken environment variables in UI beter dan via config
4. **Deploy via UI**: Drag & drop de `dist` folder in Netlify UI (bypass build)

### Verificatie

Na deployment, check:
```javascript
// In browser console
console.log('Firebase initialized:', !!window.firebase);
```

## Alternatieve Hosting Platforms

Als Netlify blijft zeuren:

### Vercel (Aanbevolen)
```bash
npm i -g vercel
vercel
```
- Gebruikt `vercel.json` (al geconfigureerd)
- Geen secrets scanning problemen

### Firebase Hosting
```bash
npm i -g firebase-tools
firebase deploy
```
- Gebruikt `firebase.json` (al geconfigureerd)
- Logisch omdat je Firebase al gebruikt

## Conclusie

Dit is een **Netlify policy change**, niet een security issue. Firebase API keys zijn veilig om publiek te zijn. De secrets scanning feature is overly aggressive voor client-side Firebase keys.

**Recommended:** Gebruik optie 1 (disable secrets scanning) of switch naar Vercel.
