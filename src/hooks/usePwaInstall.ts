// src/hooks/usePwaInstall.ts
//
// Vangt het installatie-event van de browser op en leidt af op welk platform we
// zitten. Het event vuurt kort na het laden van de pagina, dus de listener moet
// vroeg draaien: deze hook wordt in App.tsx gemonteerd, niet pas op de
// installatiepagina zelf.

import { useCallback, useEffect, useState } from 'react';

export type Platform = 'ios' | 'android' | 'macos' | 'windows' | 'overig';
export type Browser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'overig';

/** Niet-standaard event, daarom hier zelf getypeerd. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let bewaardEvent: InstallPromptEvent | null = null;

// Meteen bij het laden van de module luisteren, want het event kan vuren
// voordat React klaar is met monteren.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    bewaardEvent = e as InstallPromptEvent;
    window.dispatchEvent(new Event('cmt-install-beschikbaar'));
  });
}

export function detecteerPlatform(ua = navigator.userAgent): Platform {
  // iPadOS meldt zich sinds versie 13 als Macintosh; touchpoints verraden het.
  const isIpad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPod/.test(ua) || isIpad || /iPad/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macos';
  if (/Windows/.test(ua)) return 'windows';
  return 'overig';
}

export function detecteerBrowser(ua = navigator.userAgent): Browser {
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Edg\//.test(ua)) return 'edge';
  if (/Firefox\/|FxiOS/.test(ua)) return 'firefox';
  // Op iOS gebruikt elke browser WebKit; alleen echte Safari heeft geen extra tag.
  if (/CriOS/.test(ua)) return 'chrome';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return 'overig';
}

function draaitStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true;
}

export function usePwaInstall() {
  const [kanInstalleren, setKanInstalleren] = useState(bewaardEvent !== null);
  const [isGeinstalleerd, setIsGeinstalleerd] = useState(draaitStandalone);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    const opBeschikbaar = () => setKanInstalleren(true);
    const opGeinstalleerd = () => {
      bewaardEvent = null;
      setKanInstalleren(false);
      setIsGeinstalleerd(true);
    };

    window.addEventListener('cmt-install-beschikbaar', opBeschikbaar);
    window.addEventListener('appinstalled', opGeinstalleerd);

    const media = window.matchMedia('(display-mode: standalone)');
    const opModusWissel = () => setIsGeinstalleerd(draaitStandalone());
    media.addEventListener('change', opModusWissel);

    return () => {
      window.removeEventListener('cmt-install-beschikbaar', opBeschikbaar);
      window.removeEventListener('appinstalled', opGeinstalleerd);
      media.removeEventListener('change', opModusWissel);
    };
  }, []);

  const installeer = useCallback(async () => {
    if (!bewaardEvent) return;
    setBezig(true);
    try {
      await bewaardEvent.prompt();
      const { outcome } = await bewaardEvent.userChoice;
      if (outcome === 'accepted') {
        bewaardEvent = null;
        setKanInstalleren(false);
      }
    } finally {
      setBezig(false);
    }
  }, []);

  return {
    kanInstalleren,
    isGeinstalleerd,
    bezig,
    installeer,
    platform: detecteerPlatform(),
    browser: detecteerBrowser(),
  };
}
