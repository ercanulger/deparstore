export interface TechnicalSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number; // Normal / Eski Fiyat
  salePrice?: number; // İndirimli Satış Fiyatı
  discountPercent?: number; // Otomatik hesaplanan indirim yüzdesi
  stock: number;
  images: string[];
  specs: TechnicalSpec[];
  paymentUrl?: string; // Lemon Squeezy veya doğrudan güvenli ödeme linki
  deliveryType?: 'instant' | 'auto_email' | 'whatsapp' | 'download';
  deliveryTime?: string; // Örn: 'Anında Otomatik Teslim', '5-15 Dakika İçinde'
  platform?: string; // Örn: 'iOS', 'Android', 'PC', 'Web / TV', 'Çoklu Cihaz'
  badge?: string; // Örn: 'VIP', 'En Çok Satan', '1 Yıl Garanti', 'Anında Teslim'
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  createdAt?: string;
}

export type OrderStatus =
  | 'İnceleniyor'
  | 'Başarılı'
  | 'Başarısız'
  | 'Sipariş Alındı'
  | 'Hazırlanıyor'
  | 'Teslim Edildi'
  | 'İptal Edildi';

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  paymentUrl?: string;
  specs?: TechnicalSpec[];
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  district?: string;
  addressDetail?: string;
  notes?: string;
  zipCode?: string;
}

export type OrderAddress = ShippingAddress;

export interface PaymentDetails {
  cardHolder: string;
  cardNumberLast4?: string;
  method: 'lemon_squeezy' | 'credit_card' | 'bank_transfer' | 'crypto';
  paidAt: string;
  paymentUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  shippingAddress: ShippingAddress;
  payment: PaymentDetails;
  status: OrderStatus;
  notes?: string;
  adminNote?: string;
  digitalCode?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'discount-desc'
  | 'rating-desc'
  | 'newest';

export interface FilterState {
  category: string;
  search: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sortBy: SortOption;
}

export interface StoreSettings {
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  defaultLemonSqueezyStoreUrl: string;
  announcementText: string;
}

