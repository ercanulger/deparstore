/**
 * Lemon Squeezy Dynamic Checkout Client Helper
 */

export interface CreateCheckoutParams {
  productId: string;
  title: string;
  price: number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  orderId?: string;
  redirectUrl?: string;
}

export interface CheckoutResponse {
  success: boolean;
  url?: string;
  orderId?: string;
  price?: number;
  error?: string;
}

export function getSuccessRedirectUrl(orderId: string): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/odeme-basarili?order_id=${encodeURIComponent(orderId)}`;
  }
  return `https://deparstore.me/odeme-basarili?order_id=${encodeURIComponent(orderId)}`;
}

/**
 * Open Lemon Squeezy checkout in a new window/tab safely breaking out of iframes
 */
export function redirectToLemonCheckout(url: string): boolean {
  if (!url || typeof window === 'undefined') return false;

  try {
    // 1. Try opening clean new tab/window
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      return true;
    }
  } catch (err) {
    console.warn('window.open failed, trying window.location:', err);
  }

  // 2. Direct top-level navigation if popup was blocked
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return true;
    }
  } catch (_) {
    // Cross-origin iframe fallback
  }

  // 3. Current window navigation
  window.location.href = url;
  return true;
}

export async function createLemonCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResponse> {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Ödeme bağlantısı oluşturulamadı.');
    }

    return data;
  } catch (error: any) {
    console.error('Lemon Squeezy checkout request failed:', error);
    return {
      success: false,
      error: error.message || 'Ödeme sistemi ile bağlantı kurulamadı.',
    };
  }
}
