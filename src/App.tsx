import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db, testConnection } from './lib/firebase';
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
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { WhatsAppSupport } from './components/WhatsAppSupport';
import { Footer } from './components/Footer';
import { calculateDiscount } from './lib/utils';
import { Package, ShieldAlert, Sparkles, Plus, AlertCircle, ShoppingBag } from 'lucide-react';

function StoreApp() {
  const { user, userProfile } = useAuth();
  const { isCartOpen, setIsCartOpen } = useCart();

  // Route state (Checks /admin or #/admin in URL)
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path === '/admin' || path.startsWith('/admin') || hash === '#/admin' || hash.startsWith('#/admin');
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminPath);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      sessionStorage.getItem('deparstore_admin_auth') === 'true' ||
      localStorage.getItem('deparstore_admin_auth') === 'true'
    );
  });

  // Listen to browser URL changes (popstate, hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(checkIsAdminPath());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

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

  // Test connection & Subscribe to Firestore Products & Orders
  useEffect(() => {
    testConnection();

    // 1. Listen to products collection
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Product[] = [];
          let hasLegacyNonDigitalProduct = false;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            // Check for legacy non-digital items (e.g., shoe, clothing)
            const catLower = (data.category || '').toLowerCase();
            if (
              catLower.includes('ayakkabı') ||
              catLower.includes('giyim') ||
              catLower.includes('aksesuar') ||
              catLower.includes('moda') ||
              catLower.includes('sneaker')
            ) {
              hasLegacyNonDigitalProduct = true;
            } else {
              loaded.push(data);
            }
          });

          // If legacy physical products were in the database or loaded is empty, re-seed with pure digital catalog
          if (hasLegacyNonDigitalProduct || loaded.length === 0) {
            setProducts(INITIAL_PRODUCTS);
            seedFirestoreDatabase();
          } else {
            setProducts(loaded);
          }
        } else {
          // If Firestore is empty, seed initial digital products
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

    // 2. Listen to orders collection
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            loadedOrders.push(docSnap.data() as Order);
          });
          // Sort newest first
          loadedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(loadedOrders);
        }
      },
      (error) => {
        console.warn('Firestore orders listener fallback:', error);
      }
    );

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

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
    setIsAdminRoute(false);
  };

  const handleAdminClose = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (_) {}
    setIsAdminRoute(false);
  };

  const handleDirectCheckout = (product: Product, quantity: number) => {
    setIsCheckoutOpen(true);
  };

  // ADMIN ROUTE VIEW
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBackToStore={handleAdminClose}
        />
      );
    }

    return (
      <AdminPanel
        products={products}
        orders={orders}
        onRefreshData={() => {}}
        onCloseAdmin={handleAdminClose}
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
        whatsappNumber={storeWhatsApp}
      />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
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
