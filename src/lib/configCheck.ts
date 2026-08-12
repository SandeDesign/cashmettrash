// src/lib/configCheck.ts
//
// Firebase gooit al tijdens het importeren van lib/firebase.ts als de config
// ontbreekt, waardoor de app een wit scherm laat zien zonder uitleg. Deze check
// draait daarvóór, zodat een vergeten omgevingsvariabele in Vercel een leesbare
// melding oplevert in plaats van een blanco pagina.

const VEREIST = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/** Geeft de namen van de ontbrekende omgevingsvariabelen terug. */
export function ontbrekendeConfig(): string[] {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return VEREIST.filter((sleutel) => !env[sleutel]);
}

/** Rendert een instructiescherm in plaats van een wit scherm. */
export function toonConfigFout(ontbrekend: string[], doel: HTMLElement): void {
  console.error(
    `[CashMetTrash] Ontbrekende Firebase-configuratie: ${ontbrekend.join(', ')}. ` +
      'Zet deze in Vercel bij Settings > Environment Variables, of lokaal in .env. Zie SETUP.md.'
  );

  doel.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;
                background:#F5F3EE;font-family:'Poppins',system-ui,sans-serif;color:#14181f">
      <div style="background:#fff;border:1px solid #e3dfd6;border-radius:18px;padding:2rem;
                  max-width:32rem;box-shadow:0 4px 14px rgba(20,24,31,.08)">
        <h1 style="font-size:1.25rem;font-weight:700;margin:0 0 .5rem">Configuratie ontbreekt</h1>
        <p style="color:#4a525e;font-size:.875rem;margin:0 0 1rem">
          De Firebase-instellingen zijn niet ingevuld. Zet deze variabelen in Vercel bij
          <strong>Settings &rsaquo; Environment Variables</strong> (of lokaal in <code>.env</code>)
          en deploy opnieuw.
        </p>
        <ul style="background:#faf9f6;border:1px solid #e3dfd6;border-radius:8px;padding:.75rem 1rem .75rem 2rem;
                   font-size:.8125rem;color:#c0392b;margin:0 0 1rem">
          ${ontbrekend.map((s) => `<li><code>${s}</code></li>`).join('')}
        </ul>
        <p style="color:#7c8593;font-size:.75rem;margin:0">Zie SETUP.md voor de volledige stappen.</p>
      </div>
    </div>`;
}
