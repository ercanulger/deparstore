/**
 * Lemon Squeezy Dynamic Checkout Client Helper
 */

const PENDING_ORDERS_KEY = 'deparstore_pending_orders';
const PENDING_ORDER_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 saat sonra otomatik temizlenir

/**
 * ÖNEMLİ: Bir sipariş, kullanıcı ödeme adımına yönlendirilmeden önce
 * ASLA Firestore'a yazılmamalıdır. Aksi halde ödeme sayfasından geri
 * dönülmesi / vazgeçilmesi durumunda "hayalet" (ödenmemiş) siparişler
 * sipariş geçmişinde görünür. Bunun yerine sipariş taslağı burada,
 * yalnızca tarayıcının yerel deposunda (localStorage) tutulur ve kullanıcı
 * Lemon Squeezy'den GERÇEKTEN başarılı ödeme sonrası yönlendirildiğinde
 * (bkz. App.tsx -> odeme-basarili rotası) Firestore'a yazılır.
 */
function readPendingOrders(): Record<string, { order: any; savedAt: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PENDING_ORDERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePendingOrders(data: Record<string, { order: any; savedAt: number }>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(data));
  } catch {
    // localStorage dolu veya erişilemiyor olabilir - sessizce geç
  }
}

/** Ödeme adımına gitmeden önce sipariş taslağını yalnızca yerelde sakla. */
export function savePendingOrder(orderNumber: string, order: any): void {
  if (!orderNumber) return;
  const data = readPendingOrders();
  data[orderNumber] = { order, savedAt: Date.now() };
  writePendingOrders(data);
}

/** Gerçek ödeme sonrası (odeme-basarili sayfası) bekleyen siparişi getirir. */
export function getPendingOrder(orderNumber: string): any | null {
  if (!orderNumber) return null;
  const data = readPendingOrders();
  const entry = data[orderNumber];
  if (!entry) return null;
  if (Date.now() - entry.savedAt > PENDING_ORDER_MAX_AGE_MS) {
    delete data[orderNumber];
    writePendingOrders(data);
    return null;
  }
  return entry.order;
}

/** Sipariş Firestore'a yazıldıktan (veya vazgeçildikten) sonra taslağı temizler. */
export function clearPendingOrder(orderNumber: string): void {
  if (!orderNumber) return;
  const data = readPendingOrders();
  if (data[orderNumber]) {
    delete data[orderNumber];
    writePendingOrders(data);
  }
}

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
