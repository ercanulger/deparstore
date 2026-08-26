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
