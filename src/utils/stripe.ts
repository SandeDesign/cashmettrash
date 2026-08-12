const DEFAULT_CHECKOUT_URL = 'https://internedata.nl/uploads/vlottr/checkout.php';
const DEFAULT_PROXY_URL = 'https://internedata.nl/uploads/vlottr/stripe-proxy.php';

interface CreateCheckoutSessionOptions {
  amount: number;
  productName: string;
  customerEmail: string;
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
  proxyUrl?: string;
}

interface CreateSubscriptionCheckoutOptions {
  priceAmount: number;
  priceId?: string; // Stripe recurring price ID (price_xxxx) — heeft voorrang op priceAmount
  productName: string;
  productDescription: string;
  customerEmail: string;
  bookingId: string;
  carId: string;
  successUrl: string;
  cancelUrl: string;
  proxyUrl?: string;
}

interface CheckoutSessionResponse {
  url?: string;
  session_id?: string;
  error?: string;
}

interface RetrieveSessionOptions {
  sessionId: string;
  proxyUrl?: string;
}

interface SessionStatus {
  payment_status?: string;
  status?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions
): Promise<CheckoutSessionResponse> {
  try {
    const functionUrl = options.proxyUrl || DEFAULT_CHECKOUT_URL;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'payment',
        amount: options.amount,
        productName: options.productName,
        customerEmail: options.customerEmail,
        bookingId: options.bookingId,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Checkout sessie kon niet worden aangemaakt');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return { error: error.message || 'Betaling kon niet worden gestart' };
  }
}

export async function createSubscriptionCheckout(
  options: CreateSubscriptionCheckoutOptions
): Promise<CheckoutSessionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const amountInCents = Math.round(options.priceAmount * 100);
    const functionUrl = options.proxyUrl || DEFAULT_CHECKOUT_URL;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'subscription',
        price_id: options.priceId || '',
        payment_method_types: ['sepa_debit'],
        amount: amountInCents,
        productName: options.productName,
        productDescription: options.productDescription,
        customerEmail: options.customerEmail,
        bookingId: options.bookingId,
        carId: options.carId,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
          booking_id: options.bookingId,
          car_id: options.carId,
          subscription_type: 'car_rental'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Abonnement kon niet worden gestart`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    const message = error.name === 'AbortError'
      ? 'Betaling time-out: server reageert niet. Probeer het opnieuw.'
      : (error.message || 'Abonnement kon niet worden gestart');
    console.error('Stripe subscription checkout error:', error);
    return { error: message };
  }
}

export async function retrieveSession(
  options: RetrieveSessionOptions
): Promise<SessionStatus> {
  try {
    const functionUrl = options.proxyUrl || DEFAULT_PROXY_URL;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: options.sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sessie status kon niet worden opgehaald');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Stripe session retrieve error:', error);
    return { error: error.message || 'Status kon niet worden opgehaald' };
  }
}

export function calculateRentalPrice(weeks: number, weeklyRate: number): number {
  return weeks * weeklyRate * 100;
}
