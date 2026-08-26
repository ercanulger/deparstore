import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, testConnection } from './lib/firebase';
import { getPendingOrder, clearPendingOrder } from './lib/lemonSqueezy';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Product, Order, FilterState, Category } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { OrderStatusModal } from './components/OrderStatusModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { PaymentSuccessPage } from './components/PaymentSuccessPage';
import { PaymentFailedPage } from './components/PaymentFailedPage';
import { WhatsAppSupport } from './components/WhatsAppSupport';
import { Footer } from './components/Footer';
import { calculateDiscount } from './lib/utils';
import { Package, ShieldAlert, Sparkles, Plus, AlertCircle, ShoppingBag } from 'lucide-react';

function StoreApp() {
  const { user, userProfile } = useAuth();
  const { isCartOpen, setIsCartOpen } = useCart();
  // Ödeme onayı anında yerelde okunan sipariş taslağı: Firestore'a "kendi
  // siparişlerim" sorgusu henüz ulaşmamış olsa bile (ör. misafir/guest
  // checkout, çünkü misafir siparişleri artık toplu olarak listelenmiyor)
  // ödeme başarılı sayfası doğru siparişi hemen gösterebilsin diye tutulur.
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Multi-route detection (/admin, /odeme-basarili, /odeme-basarisiz)
  const getActiveRoute = (): 'store' | 'admin' | 'payment-success' | 'payment-failed' => {
    if (typeof window === 'undefined') return 'store';
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();

    if (
      path.includes('odeme-basarili') ||
      path.includes('payment-success') ||
      hash.includes('odeme-basarili') ||
      hash.includes('payment-success') ||
      search.includes('odeme-basarili') ||
      search.includes('payment=success')
    ) {
      return 'payment-success';
    }

    if (
      path.includes('odeme-basarisiz') ||
      path.includes('payment-failed') ||
      path.includes('cancel') ||
      hash.includes('odeme-basarisiz') ||
      hash.includes('payment-failed') ||
      search.includes('odeme-basarisiz') ||
      search.includes('payment=failed') ||
      search.includes('payment=cancel')
    ) {
      return 'payment-failed';
    }

    if (
      path === '/admin' ||
      path.startsWith('/admin') ||
      path.includes('/admin') ||
      hash === '#/admin' ||
      hash.startsWith('#/admin') ||
      hash.includes('admin') ||
      search.includes('admin')
    ) {
      return 'admin';
    }

    return 'store';
  };

  const [currentRoute, setCurrentRoute] = useState<'store' | 'admin' | 'payment-success' | 'payment-failed'>(getActiveRoute);
  const [currentOrderIdParam, setCurrentOrderIdParam] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('order_id') || params.get('orderId') || params.get('id') || '';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('deparstore_admin_auth') === 'true' ||
      localStorage.getItem('deparstore_admin_auth') === 'true'
    );
  });

  // Listen to browser URL changes (popstate, hashchange, plus polling)
  useEffect(() => {
    const handleUrlChange = () => {
      const active = getActiveRoute();
      setCurrentRoute((prev) => (prev !== active ? active : prev));

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const oId = params.get('order_id') || params.get('orderId') || params.get('id') || '';
        if (oId) setCurrentOrderIdParam(oId);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    
    const interval = setInterval(handleUrlChange, 250);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      clearInterval(interval);
    };
  }, []);

  // Ödeme GERÇEKTEN başarıyla tamamlanıp Lemon Squeezy kullanıcıyı
  // /odeme-basarili sayfasına geri yönlendirdiğinde, o siparişin yerelde
  // bekleyen taslağını Firestore'a yazar. Sipariş, bu noktaya kadar
  // Firestore'a hiç yazılmaz - böylece ödeme sayfasından vazgeçilen veya
  // tamamlanmayan denemeler sipariş geçmişinde/panelinde görünmez.
  useEffect(() => {
    if (currentRoute !== 'payment-success' || !currentOrderIdParam) return;

    const pendingOrder = getPendingOrder(currentOrderIdParam);
    if (!pendingOrder) return;

    // Sadece bu tarayıcının bildiği taslağı state'e al - Firestore sorgusu
    // beklemeden onay sayfasında hemen gösterilebilsin.
    setLastCompletedOrder(pendingOrder);

    (async () => {
      try {
        await setDoc(doc(db, 'orders', pendingOrder.id), pendingOrder);
        localStorage.setItem('deparstore_active_order_id', pendingOrder.id);
      } catch (err) {
        console.warn('Ödeme onaylandı fakat sipariş Firestore\'a yazılamadı:', err);
      } finally {
        clearPendingOrder(currentOrderIdParam);
      }
    })();
  }, [currentRoute, currentOrderIdParam]);

  // Primary Data State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [storeWhatsApp, setStoreWhatsApp] = useState<string>(() => {
    return localStorage.getItem('deparstore_whatsapp') || '905010000000';
  });

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeReviewOrder, setActiveReviewOrder] = useState<Order | null>(null);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState<boolean>(false);

  // Restore active review order from localStorage or sync with orders array
  useEffect(() => {
    const savedOrderId = localStorage.getItem('deparstore_active_order_id');
    if (savedOrderId && orders.length > 0) {
      const match = orders.find((o) => o.id === savedOrderId);
      if (match) {
        setActiveReviewOrder(match);
      }
    }
  }, [orders]);

  // Filter & Search State
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    search: '',
    minPrice: 0,
    maxPrice: 200000,
    inStockOnly: false,
    onSaleOnly: false,
    sortBy: 'default',
  });

  // Helper to sync INITIAL_PRODUCTS into Firestore
  const seedFirestoreDatabase = async () => {
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      console.log('Digital products successfully seeded into Firestore');
    } catch (e) {
      console.warn('Auto-seed note:', e);
    }
  };

  // Test connection & Subscribe to Firestore Products, Orders, and Settings in Real-Time
  useEffect(() => {
    testConnection();

    // 1. Real-time Listen to products collection
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            if (data && data.id && data.title) {
              loaded.push(data);
            }
          });

          if (loaded.length > 0) {
            // Keep newest/updated products at top by default
            loaded.sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime();
              const timeB = new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
            setProducts(loaded);
          } else {
            setProducts(INITIAL_PRODUCTS);
          }
        } else {
          // If Firestore is completely empty on initial setup, seed initial digital products
          setProducts(INITIAL_PRODUCTS);
          seedFirestoreDatabase();
        }
        setLoadingProducts(false);
      },
      (error) => {
        console.warn('Firestore products listener fallback to initial digital catalog:', error);
        setProducts(INITIAL_PRODUCTS);
        setLoadingProducts(false);
      }
    );

    // 2. Real-time Listen to store settings (WhatsApp number, announcement)
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.whatsappNumber) {
            setStoreWhatsApp(data.whatsappNumber);
          }
        }
      },
      (error) => {
        console.warn('Firestore settings listener note:', error);
      }
    );

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Siparişleri dinle: KİM olduğuna göre farklı bir sorgu kullanılır.
  // - Admin panelindeyken (gerçekten admin oturumu açmışken): tüm siparişler.
  // - Mağaza görünümünde: sadece giriş yapmış kullanıcının KENDİ siparişleri
  //   (Firestore güvenlik kuralları da bunu zorunlu kılıyor - bkz. firestore.rules).
  // Giriş yapılmamışsa (misafir) sipariş listesi boş kalır; misafirin kendi
  // siparişi ödeme sonrası `lastCompletedOrder` ile ayrıca gösterilir.
  useEffect(() => {
    if (currentRoute === 'admin' && isAdminAuthenticated) {
      const unsubAdminOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const loadedOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            if (data && data.id) {
              loadedOrders.push(data);
            }
          });
          loadedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setOrders(loadedOrders);
        },
        (error) => {
          // Bu, admin girişi artık gerçek bir Firebase Authentication oturumu
          // gerektirdiği için, eski (yerel/sahte) admin oturumlarında beklenen bir durumdur.
          console.warn('Admin sipariş listesi alınamadı (gerçek admin girişi gerekiyor):', error);
          setOrders([]);
        }
      );
      return () => unsubAdminOrders();
    }

    if (!user) {
      setOrders([]);
      return;
    }

    const ownOrdersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubOwnOrders = onSnapshot(
      ownOrdersQuery,
      (snapshot) => {
        const loadedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          if (data && data.id) {
            loadedOrders.push(data);
          }
        });
        loadedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setOrders(loadedOrders);
      },
      (error) => {
        console.warn('Sipariş geçmişi alınamadı:', error);
        setOrders([]);
      }
    );

    return () => unsubOwnOrders();
  }, [currentRoute, isAdminAuthenticated, user]);

  // Compute categories with active product counts
  const categoriesWithCounts: Category[] = useMemo(() => {
    return INITIAL_CATEGORIES.map((cat) => {
      if (cat.slug === 'all') {
        return { ...cat, count: products.length };
      }
      const count = products.filter(
        (p) => p.category.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return { ...cat, count };
    });
  }, [products]);

  // Filtering & Sorting Engine
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (filters.category !== 'all') {
      const selectedCategoryObj = INITIAL_CATEGORIES.find((c) => c.slug === filters.category);
      if (selectedCategoryObj) {
        result = result.filter(
          (p) => p.category.toLowerCase() === selectedCategoryObj.name.toLowerCase()
        );
      }
    }

    // 2. Instant Live Search
    if (filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const descMatch = p.description.toLowerCase().includes(q);
        const categoryMatch = p.category.toLowerCase().includes(q);
        const specMatch = p.specs?.some(
          (s) =>
            s.key.toLowerCase().includes(q) ||
            s.value.toLowerCase().includes(q)
        );
        return titleMatch || descMatch || categoryMatch || specMatch;
      });
    }

    // 3. Price Range Filter
    result = result.filter((p) => {
      const effPrice = p.salePrice ?? p.price;
      const minPass = filters.minPrice ? effPrice >= filters.minPrice : true;
      const maxPass = filters.maxPrice ? effPrice <= filters.maxPrice : true;
      return minPass && maxPass;
    });

    // 4. In Stock Only
    if (filters.inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    // 5. On Sale Only
    if (filters.onSaleOnly) {
      result = result.filter((p) => p.salePrice && p.salePrice < p.price);
    }

    // 6. Sorting
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case 'discount-desc':
        result.sort((a, b) => {
          const discA = a.discountPercent || calculateDiscount(a.price, a.salePrice);
          const discB = b.discountPercent || calculateDiscount(b.price, b.salePrice);
          return discB - discA;
        });
        break;
      case 'rating-desc':
        result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      default:
        // Featured products first
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [products, filters]);

  const handleAdminLogout = () => {
    sessionStorage.removeItem('deparstore_admin_auth');
    localStorage.removeItem('deparstore_admin_auth');
    setIsAdminAuthenticated(false);
    try {
      window.history.pushState({}, '', '/');
    } catch (_) {}
    setCurrentRoute('store');
  };

  const handleBackToStore = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (_) {}
    setCurrentRoute('store');
  };

  const handleDirectCheckout = (product: Product, quantity: number) => {
    setIsCheckoutOpen(true);
  };

  // PAYMENT SUCCESS VIEW
  if (currentRoute === 'payment-success') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenOrders={() => setIsOrderHistoryOpen(true)}
          onSelectCategory={(slug) => {
            handleBackToStore();
            setFilters((prev) => ({ ...prev, category: slug }));
          }}
        />
        <PaymentSuccessPage
          orderId={currentOrderIdParam}
          orders={lastCompletedOrder ? [lastCompletedOrder, ...orders] : orders}
          onGoHome={handleBackToStore}
          whatsappNumber={storeWhatsApp}
        />
        <Footer
          categories={categoriesWithCounts}
          onSelectCategory={(slug) => {
            handleBackToStore();
            setFilters((prev) => ({ ...prev, category: slug }));
          }}
        />
      </div>
    );
  }

  // PAYMENT FAILED VIEW
  if (currentRoute === 'payment-failed') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenOrders={() => setIsOrderHistoryOpen(true)}
          onSelectCategory={(slug) => {
            handleBackToStore();
            setFilters((prev) => ({ ...prev, category: slug }));
          }}
        />
        <PaymentFailedPage
          onGoHome={handleBackToStore}
          whatsappNumber={storeWhatsApp}
        />
        <Footer
          categories={categoriesWithCounts}
          onSelectCategory={(slug) => {
            handleBackToStore();
            setFilters((prev) => ({ ...prev, category: slug }));
          }}
        />
      </div>
    );
  }

  // ADMIN ROUTE VIEW
  if (currentRoute === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBackToStore={handleBackToStore}
        />
      );
    }

    return (
      <AdminPanel
        products={products}
        orders={orders}
        onRefreshData={() => {}}
        onCloseAdmin={handleBackToStore}
        onLogout={handleAdminLogout}
        onSeedDatabase={seedFirestoreDatabase}
        whatsappNumber={storeWhatsApp}
        onUpdateWhatsApp={(num) => setStoreWhatsApp(num)}
      />
    );
  }

  // PUBLIC STOREFRONT VIEW
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation Bar (No admin UI or demo buttons) */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenOrders={() => setIsOrderHistoryOpen(true)}
        onSelectCategory={(slug) => setFilters((prev) => ({ ...prev, category: slug }))}
        currentCategory={filters.category}
        searchQuery={filters.search}
        onSearchChange={(q) => setFilters((prev) => ({ ...prev, search: q }))}
        activePendingOrder={activeReviewOrder}
        onOpenOrderStatus={() => setIsOrderStatusOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        
        {/* Hero Banner with Digital Product Focus */}
        <HeroBanner
          categories={categoriesWithCounts}
          currentCategory={filters.category}
          onSelectCategory={(slug) => setFilters((prev) => ({ ...prev, category: slug }))}
        />

        {/* Live Filter & Sorting Bar */}
        <FilterBar
          categories={categoriesWithCounts}
          filters={filters}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onResetFilters={() =>
            setFilters({
              category: 'all',
              search: '',
              minPrice: 0,
              maxPrice: 200000,
              inStockOnly: false,
              onSaleOnly: false,
              sortBy: 'default',
            })
          }
          totalProductsCount={products.length}
          filteredProductsCount={filteredProducts.length}
        />

        {/* Products Grid */}
        <section>
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs animate-pulse space-y-3"
                >
                  <div className="aspect-square bg-zinc-200 rounded-xl"></div>
                  <div className="h-4 bg-zinc-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-zinc-100 rounded-md w-1/2"></div>
                  <div className="h-6 bg-zinc-200 rounded-lg w-full mt-2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80 shadow-xs max-w-lg mx-auto space-y-4 my-8">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Aradığınız kriterlere uygun ürün bulunamadı</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Farklı bir kategori seçebilir veya arama filtrenizi temizleyerek tüm dijital ürün kataloğunu görüntüleyebilirsiniz.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    category: 'all',
                    search: '',
                    minPrice: 0,
                    maxPrice: 200000,
                    inStockOnly: false,
                    onSaleOnly: false,
                    sortBy: 'default',
                  })
                }
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Floating 7/24 WhatsApp Support Widget */}
      <WhatsAppSupport
        phoneNumber={storeWhatsApp}
        defaultMessage="Merhaba DeparStore, Apple P12 / VIP Hile / Dijital Hesap satın almak ve bilgi almak istiyorum."
      />

      {/* Footer */}
      <Footer
        categories={categoriesWithCounts}
        onSelectCategory={(slug) => setFilters((prev) => ({ ...prev, category: slug }))}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onDirectCheckout={handleDirectCheckout}
        whatsappNumber={storeWhatsApp}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Live Order Status / Review Modal */}
      <OrderStatusModal
        isOpen={isOrderStatusOpen}
        order={activeReviewOrder}
        onClose={() => setIsOrderStatusOpen(false)}
        whatsappNumber={storeWhatsApp}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        orders={orders}
      />

      {/* Customer Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreApp />
      </CartProvider>
    </AuthProvider>
  );
}
