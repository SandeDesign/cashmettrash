// src/utils/stripe.ts
//
// Stripe loopt uitsluitend via de PHP-proxy op internedata.nl; de secret key
// staat alleen server-side. Alleen eenmalige betalingen (mode: 'payment') —
// er zijn geen abonnementen in CashMetTrash.
//
// Alle bedragen zijn in centen.

import { CHECKOUT_URL, STRIPE_PROXY_URL } from './constants';

interface CheckoutOptions {
  /** Bedrag in centen. */
  bedragCenten: number;
  productNaam: string;
  klantEmail: string;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResponse {
  url?: string;
  session_id?: string;
  error?: string;
}

export interface SessieStatus {
  payment_status?: string;
  status?: string;
  payment_intent?: string;
  metadata?: Record<string, string>;
  error?: string;
}

const TIMEOUT_MS = 30000;

async function postMetTimeout(url: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Maakt een eenmalige Stripe Checkout-sessie aan voor een glas-ophaalbeurt. */
export async function createCheckoutSession(options: CheckoutOptions): Promise<CheckoutResponse> {
  try {
    const response = await postMetTimeout(CHECKOUT_URL, {
      mode: 'payment',
      amount: options.bedragCenten,
      currency: 'eur',
      productName: options.productNaam,
      customerEmail: options.klantEmail,
      orderId: options.orderId,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        order_id: options.orderId,
        flow: 'glas',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Betaling kon niet worden gestart (HTTP ${response.status})`);
    }

    return await response.json();
  } catch (error: unknown) {
    const bericht =
      error instanceof Error && error.name === 'AbortError'
        ? 'De betaalserver reageert niet. Probeer het opnieuw.'
        : error instanceof Error
          ? error.message
          : 'Betaling kon niet worden gestart';
    console.error('[Stripe] checkout mislukt:', error);
    return { error: bericht };
  }
}

/** Haalt de status van een Checkout-sessie op na terugkeer uit Stripe. */
export async function retrieveSession(sessionId: string): Promise<SessieStatus> {
  try {
    const response = await postMetTimeout(STRIPE_PROXY_URL, { sessionId });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Betaalstatus kon niet worden opgehaald');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('[Stripe] sessie ophalen mislukt:', error);
    return {
      error: error instanceof Error ? error.message : 'Betaalstatus kon niet worden opgehaald',
    };
  }
}
