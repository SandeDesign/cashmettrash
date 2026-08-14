/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_CHECKOUT_URL?: string;
  readonly VITE_STRIPE_PROXY_URL?: string;
  readonly VITE_PUSH_URL?: string;
  /** Web Push-certificaat uit Firebase, nodig om meldingen te kunnen ontvangen. */
  readonly VITE_FIREBASE_VAPID_KEY?: string;
  /** Gratis sleutel van openrouteservice.org. Zonder sleutel geen routeplanner. */
  readonly VITE_ORS_API_KEY?: string;
  /** Basis-URL van OpenRouteService. Leeg laten tenzij het adres verhuist. */
  readonly VITE_ORS_BASIS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
