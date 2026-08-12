# Cache & MIME Type Error Troubleshooting

## Het "MIME type" Wit Scherm Probleem

### Symptomen
- Console error: "Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of 'text/html'"
- Wit scherm na deployment van nieuwe versie
- App werkte voorheen, maar niet meer na update

### Oorzaak
De Service Worker cached oude JavaScript bestanden. Wanneer een nieuwe versie wordt gedeployed met nieuwe bestandsnamen (bijv. `ui-vendor-ABC123.js` → `ui-vendor-XYZ789.js`), probeert de browser het nieuwe bestand te laden maar krijgt een fallback naar `index.html` → MIME type error.

### Oplossing voor Eindgebruikers

#### Methode 1: Hard Refresh (Snelst)
- **Windows/Linux**: `Ctrl + Shift + R` of `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### Methode 2: Handmatig Cache Wissen
1. Open Developer Tools (`F12`)
2. Ga naar "Application" tab
3. Klik "Clear storage" in de sidebar
4. Selecteer alles en klik "Clear site data"
5. Herlaad de pagina

#### Methode 3: Service Worker Unregister
```javascript
// Voer uit in browser console (F12)
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
  console.log('Service Workers verwijderd');
  location.reload();
});
```

### Preventie (Developers)

#### 1. Service Worker Versie Update
Bij elke deployment, update de versie in `public/service-worker.js`:
```javascript
const CACHE_VERSION = 'v1.2.1'; // Verhoog dit nummer
```

#### 2. Deployment Checklist
- [ ] Update `CACHE_VERSION` in service-worker.js
- [ ] Run `npm run build`
- [ ] Deploy naar hosting platform
- [ ] Test in incognito window
- [ ] Verify service worker update in DevTools

#### 3. Automatische Update Notificatie
De app detecteert nu automatisch nieuwe versies en vraagt gebruikers om te refreshen.

### Hosting Platform Setup

#### Vercel
`vercel.json` is geconfigureerd voor:
- SPA routing fallback
- Correcte MIME types
- Service Worker headers

#### Netlify
`netlify.toml` en `public/_redirects` zijn geconfigureerd voor:
- SPA routing fallback
- Correcte MIME types

#### Firebase Hosting
`firebase.json` is geconfigureerd voor:
- SPA routing fallback
- Asset caching
- Correcte MIME types

### Monitoring

#### Check Service Worker Status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
```

#### Check Cache Status
```javascript
// In browser console
caches.keys().then(keys => console.log('Cached:', keys));
```

#### Clear All Caches (Developer)
```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared');
});
```

### Best Practices

1. **Test in Incognito**: Altijd na deployment testen in een incognito window
2. **Version Bumping**: Bij elke deployment de cache versie verhogen
3. **User Communication**: Gebruikers informeren over updates
4. **Monitoring**: Console logs checken voor cache issues

### Emergency Fix

Als gebruikers massaal problemen hebben:

1. **Quick Fix**: Service Worker temporary disablen
   ```javascript
   // In index.html, comment out service worker registration
   ```

2. **Cache Bust**: Query parameter toevoegen
   ```javascript
   window.location.href = window.location.href + '?v=' + Date.now();
   ```

3. **Force Update**: Update notification laten zien met force reload

### Contact

Bij aanhoudende problemen, check:
- Browser console voor errors
- Network tab voor failed requests
- Application tab voor service worker status
