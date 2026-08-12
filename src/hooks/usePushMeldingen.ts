// src/hooks/usePushMeldingen.ts
//
// Regelt de ontvangkant van pushmeldingen: toestemming vragen en het apparaat
// registreren. Het token komt in pushTokens/{uid}; de PHP-proxy leest die
// collectie server-side en stuurt de meldingen. De app hoeft dus nooit tokens
// van anderen te kennen.
//
// Let op voor iPhone en iPad: Apple staat webmeldingen alleen toe als de app op
// het beginscherm staat. Daarom kijkt deze hook of dat het geval is.

import { useCallback, useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Rol } from '../types';

export type PushStatus =
  | 'nietOndersteund'
  | 'moetInstalleren'
  | 'geenSleutel'
  | 'nietGevraagd'
  | 'geweigerd'
  | 'aan'
  | 'bezig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function draaitStandalone(): boolean {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true;
}

function isApple(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function beginStatus(): PushStatus {
  if (typeof window === 'undefined') return 'nietOndersteund';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'nietOndersteund';
  // Op de iPhone werkt het pas als de app op het beginscherm staat.
  if (isApple() && !draaitStandalone()) return 'moetInstalleren';
  if (!VAPID_KEY) return 'geenSleutel';
  if (Notification.permission === 'granted') return 'aan';
  if (Notification.permission === 'denied') return 'geweigerd';
  return 'nietGevraagd';
}

export function usePushMeldingen(uid: string | undefined, rol: Rol | undefined) {
  const [status, setStatus] = useState<PushStatus>('nietGevraagd');

  useEffect(() => {
    setStatus(beginStatus());
  }, []);

  /** Vraagt het token op en slaat het op bij de gebruiker. */
  const registreer = useCallback(async () => {
    if (!uid || !rol || !VAPID_KEY) return;

    const registration = await navigator.serviceWorker.ready;
    // De messaging-module is zwaar en alleen hier nodig, dus lazy geladen.
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) {
      setStatus('nietOndersteund');
      return;
    }

    const token = await getToken(getMessaging(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      setStatus('geweigerd');
      return;
    }

    await setDoc(
      doc(db, 'pushTokens', uid),
      { uid, rol, token, bijgewerktOp: serverTimestamp() },
      { merge: true }
    );
    setStatus('aan');
  }, [uid, rol]);

  /** Vraagt toestemming en registreert daarna meteen. */
  const zetAan = useCallback(async () => {
    setStatus('bezig');
    try {
      const toestemming = await Notification.requestPermission();
      if (toestemming !== 'granted') {
        setStatus(toestemming === 'denied' ? 'geweigerd' : 'nietGevraagd');
        return;
      }
      await registreer();
    } catch (error: unknown) {
      console.warn('[Push] aanzetten mislukt:', error);
      setStatus('nietGevraagd');
    }
  }, [registreer]);

  // Al toestemming gegeven? Dan het token verversen, want het kan verlopen of
  // veranderen als de gebruiker de app opnieuw installeert.
  useEffect(() => {
    if (status === 'aan' && uid && rol) {
      registreer().catch((error) => console.warn('[Push] verversen mislukt:', error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status === 'aan', uid, rol]);

  return { status, zetAan };
}
