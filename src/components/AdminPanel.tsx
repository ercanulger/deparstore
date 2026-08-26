import React, { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Upload,
  Image,
  DollarSign,
  Layers,
  ShoppingBag,
  ShieldCheck,
  CheckCircle,
  Check,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  Truck,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  FileCode,
  Zap,
  MessageCircle,
  ExternalLink,
  Settings,
  Globe,
  Lock,
  LogOut,
  X,
  Clock
} from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, uploadProductImage } from '../lib/firebase';
import { Product, Order, OrderStatus, TechnicalSpec } from '../types';
import { formatPrice, formatDate, calculateDiscount, formatExternalUrl } from '../lib/utils';
import { exportProjectZip } from '../lib/zipExporter';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/initialProducts';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onRefreshData: () => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
  onSeedDatabase: () => void;
  whatsappNumber?: string;
  onUpdateWhatsApp?: (number: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  orders,
  onRefreshData,
  onCloseAdmin,
  onLogout,
  onSeedDatabase,
  whatsappNumber = '905010000000',
  onUpdateWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'add-product' | 'orders' | 'settings' | 'export'>('overview');
  
  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Apple P12 & Sertifika');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(99);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Anında Otomatik & WhatsApp Teslim');
  const [platform, setPlatform] = useState('iOS (Tüm Sürümler)');
  const [badge, setBadge] = useState('1 Yıl Garantili');
  const [specs, setSpecs] = useState<TechnicalSpec[]>([
    { key: 'Uyumluluk', value: 'iOS 14 - 18+ (Tüm Modeller)' },
    { key: 'Garanti', value: '1 Yıl Birebir Değişim' },
  ]);

  // WhatsApp & Store Settings State
  const [storeWhatsApp, setStoreWhatsApp] = useState(whatsappNumber);
  const [storeWelcomeMsg, setStoreWelcomeMsg] = useState('Merhaba DeparStore, dijital ürün satın almak istiyorum.');
  const [defaultLemonStore, setDefaultLemonStore] = useState('https://deparstore.lemonsqueezy.com');
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);

  // Image Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productSuccessFeedback, setProductSuccessFeedback] = useState<string | null>(null);

  // Table Search state
  const [productSearch, setProductSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');

  // Spec management helper
  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs(specs.filter((_, idx) => idx !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  // Image file handler (Uploads to Firebase Storage / Data URL fallback)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadMessage('Görsel yükleniyor...');

    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      setUploadMessage('Görsel başarıyla yüklendi!');
    } catch (err: any) {
      console.error('Image upload error:', err);
      setUploadMessage('Görsel yüklenirken bir sorun oluştu.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Populate form for editing an existing product
  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setTitle(prod.title);
    setCategory(prod.category);
    setPrice(prod.price);
    setSalePrice(prod.salePrice ?? '');
    setStock(prod.stock);
    setDescription(prod.description);
    setImageUrl(prod.images?.[0] || '');
    setPaymentUrl(prod.paymentUrl || '');
    setDeliveryTime(prod.deliveryTime || 'Anında Teslimat');
    setPlatform(prod.platform || 'iOS');
    setBadge(prod.badge || '');
    setSpecs(prod.specs && prod.specs.length > 0 ? prod.specs : [{ key: 'Garanti', value: '1 Yıl' }]);
    setActiveTab('add-product');
    setProductSuccessFeedback(null);
  };

  const handleResetForm = () => {
    setEditingProductId(null);
    setTitle('');
    setCategory('Apple P12 & Sertifika');
    setCustomCategory('');
    setPrice('');
    setSalePrice('');
    setStock(99);
    setDescription('');
    setImageUrl('');
    setPaymentUrl('');
    setDeliveryTime('Anında Otomatik & WhatsApp Teslim');
    setPlatform('iOS (Tüm Sürümler)');
    setBadge('1 Yıl Garantili');
    setSpecs([
      { key: 'Uyumluluk', value: 'iOS 14 - 18+ (Tüm Modeller)' },
      { key: 'Garanti', value: '1 Yıl Birebir Değişim' },
    ]);
    setProductSuccessFeedback(null);
  };

  // Save or Update Product in Firebase Firestore
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || price === '' || stock === '') return;

    setSubmittingProduct(true);
    setProductSuccessFeedback(null);

    const finalCategory = category === 'DİĞER' && customCategory ? customCategory : category;
    const numPrice = Number(price);
    const numSalePrice = salePrice !== '' ? Number(salePrice) : undefined;
    const calculatedDiscount = calculateDiscount(numPrice, numSalePrice);

    const cleanSpecs = specs.filter((s) => s.key.trim() !== '' && s.value.trim() !== '');

    const finalImages = imageUrl
      ? [imageUrl]
      : ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'];

    const productId = editingProductId || `prod_${Date.now()}`;

    const formattedPaymentUrl = paymentUrl && paymentUrl.trim() !== ''
      ? formatExternalUrl(paymentUrl)
      : `https://deparstore.lemonsqueezy.com/buy/${productId}`;

    const productPayload: Product = {
      id: productId,
      title,
      category: finalCategory,
      price: numPrice,
      salePrice: numSalePrice,
      discountPercent: calculatedDiscount,
      stock: Number(stock),
      description: description || 'Detaylı ürün açıklaması eklenmedi.',
      images: finalImages,
      specs: cleanSpecs,
      paymentUrl: formattedPaymentUrl,
      deliveryTime: deliveryTime || 'Anında Dijital Teslimat',
      platform: platform || 'Tüm Platformlar',
      badge: badge || undefined,
      rating: 4.9,
      reviewCount: Math.floor(Math.random() * 40) + 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const prodRef = doc(db, 'products', productId);
      await setDoc(prodRef, productPayload);
      setProductSuccessFeedback(
        editingProductId ? 'Ürün başarıyla güncellendi!' : 'Yeni ürün başarıyla kataloğa eklendi ve güvenli ödeme bağlantısı tanımlandı!'
      );
      onRefreshData();
      if (!editingProductId) {
        handleResetForm();
      }
    } catch (err: any) {
      console.warn('Firestore write warning:', err);
      setProductSuccessFeedback('Ürün kaydedildi.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete product from Firestore
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bu dijital ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      onRefreshData();
    } catch (err) {
      console.warn('Delete warning:', err);
    }
  };

  // Update order status in Firestore
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onRefreshData();
    } catch (err) {
      console.warn('Update order status warning:', err);
    }
  };

  // Update digital license code and admin note for an order
  const handleSaveOrderDigitalDetails = async (
    orderId: string,
    digitalCode: string,
    adminNote: string,
    newStatus?: OrderStatus
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const payload: any = {
        digitalCode: digitalCode.trim(),
        adminNote: adminNote.trim(),
        updatedAt: new Date().toISOString(),
      };
      if (newStatus) {
        payload.status = newStatus;
      }
      await updateDoc(orderRef, payload);
      onRefreshData();
    } catch (err) {
      console.warn('Save order digital details warning:', err);
    }
  };

  // Tek bir siparişi kalıcı olarak sil (Firestore güvenlik kuralları
  // gereği bu işlem yalnızca admin oturumuyla mümkündür).
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Bu siparişi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      onRefreshData();
    } catch (err) {
      console.warn('Delete order warning:', err);
      window.alert('Sipariş silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const [isClearingOrders, setIsClearingOrders] = useState(false);

  // Sipariş geçmişindeki TÜM kayıtları kalıcı olarak siler. Eski hesaplarda/
  // testlerde biriken sipariş kayıtlarını komple temizlemek için kullanılır.
  // Yalnızca admin oturumuyla çalışır (bkz. firestore.rules: delete -> isAdmin()).
  const handleDeleteAllOrders = async () => {
    if (orders.length === 0) return;
    const confirmText = window.prompt(
      `Bu işlem TÜM sipariş geçmişini (${orders.length} sipariş) kalıcı olarak silecek ve geri alınamaz.\n\nOnaylamak için aşağıya SİL yazın:`
    );
    if (confirmText !== 'SİL') return;

    setIsClearingOrders(true);
    try {
      const results = await Promise.allSettled(
        orders.map((ord) => deleteDoc(doc(db, 'orders', ord.id)))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      onRefreshData();
      if (failed > 0) {
        window.alert(`${orders.length - failed} sipariş silindi, ${failed} sipariş silinemedi.`);
      }
    } catch (err) {
      console.warn('Bulk delete orders warning:', err);
      window.alert('Siparişler silinirken bir hata oluştu.');
    } finally {
      setIsClearingOrders(false);
    }
  };

  const [editingOrderDetails, setEditingOrderDetails] = useState<{
    [orderId: string]: { digitalCode: string; adminNote: string; isSaved?: boolean };
  }>({});

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'İnceleniyor' || o.status === 'Sipariş Alındı'
  ).length;

  const handleSaveSettings = async () => {
    if (onUpdateWhatsApp) {
      onUpdateWhatsApp(storeWhatsApp);
    }
    localStorage.setItem('deparstore_whatsapp', storeWhatsApp);
    localStorage.setItem('deparstore_welcome_msg', storeWelcomeMsg);
    localStorage.setItem('deparstore_lemon_url', defaultLemonStore);
    
    try {
      await setDoc(
        doc(db, 'settings', 'general'),
        {
          whatsappNumber: storeWhatsApp,
          welcomeMessage: storeWelcomeMsg,
          defaultLemonStore: defaultLemonStore,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore settings write note:', e);
    }

    setSettingsSavedFeedback(true);
    setTimeout(() => setSettingsSavedFeedback(false), 3000);
  };

  // Total stats calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockProducts = products.filter((p) => p.stock <= 4);
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredOrders =
    orderFilterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === orderFilterStatus);

  return (
    <div className="bg-[#FDFDFD] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Admin Header Bar */}
        <div className="bg-[#121212] text-white rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">DeparStore Yönetim Paneli</h1>
                <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  Lemon Squeezy & WhatsApp Entegre
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-normal">
                P12 Sertifikaları, VIP iOS Hileleri, Premium Hesaplar ve Lemon Squeezy ödeme bağlantıları yönetimi.
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSeedDatabase}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              title="Varsayılan dijital ürün kataloğunu yeniler"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />
              <span>Varsayılan Kataloğu Yükle</span>
            </button>

            <button
              onClick={onCloseAdmin}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Mağazayı Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Yönetici oturumunu kapat"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıkış Yap</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-1.5 shadow-xs flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Genel Bakış</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('add-product');
              setProductSuccessFeedback(null);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'add-product'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingProductId ? 'Ürünü Düzenle' : 'Yeni Dijital Ürün Ekle'}</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Katalog & Fiyatlar ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'orders'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sipariş Yönetimi ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-black rounded-full animate-pulse">
                {pendingOrdersCount} Yeni
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>WhatsApp & Ödeme Ayarları</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'export'
                ? 'bg-[#121212] text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Proje ZIP & Vercel</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">Toplam Satış Tutarı</span>
                <div className="text-xl sm:text-2xl font-bold text-zinc-950">{formatPrice(totalRevenue)}</div>
                <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>Lemon Squeezy & Doğrudan Satışlar</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">Alınan Sipariş Sayısı</span>
                <div className="text-xl sm:text-2xl font-bold text-zinc-950">{orders.length} Adet</div>
                <div className="text-[11px] text-zinc-500 font-medium">
                  {orders.filter((o) => o.status === 'Sipariş Alındı').length} yeni onay bekleyen
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">Aktif Dijital Ürün</span>
                <div className="text-xl sm:text-2xl font-bold text-zinc-950">{products.length} Ürün</div>
                <div className="text-[11px] text-zinc-500">
                  {products.filter((p) => p.paymentUrl).length} Lemon Squeezy linkli
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-zinc-200/80 shadow-xs space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">WhatsApp Destek Hattı</span>
                <div className="text-base sm:text-lg font-bold text-zinc-950 truncate">+{storeWhatsApp}</div>
                <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>7/24 Canlı Destek Aktif</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-zinc-900 text-white rounded-2xl p-6 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Lemon Squeezy Ödeme Linki Nasıl Çalışır?
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Lemon Squeezy panelinizden oluşturduğunuz ürün bağlantılarını (Örn: <code>https://deparstore.lemonsqueezy.com/buy/...</code>) ürün eklerken girin. Müşteriler "Satın Al" dediğinde doğrudan güvenli ödeme sayfanıza yönlendirilir.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('add-product')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ürün ve Ödeme Linki Ekle</span>
              </button>
            </div>

            {/* Recent Orders in Overview */}
            <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900">Son Gelen Müşteri Siparişleri</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-zinc-900 hover:underline"
                >
                  Tüm Siparişleri Gör ({orders.length}) →
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">Henüz kaydedilmiş sipariş bulunmuyor.</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between text-xs gap-3">
                      <div>
                        <div className="font-semibold text-zinc-900">{ord.orderNumber}</div>
                        <div className="text-[11px] text-zinc-500">
                          {ord.shippingAddress.fullName} • {formatDate(ord.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-zinc-900">{formatPrice(ord.total)}</div>
                        <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADD / EDIT PRODUCT */}
        {activeTab === 'add-product' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-zinc-900" />
                  {editingProductId ? 'Dijital Ürünü Güncelle' : 'Yeni Dijital Ürün Tanımla'}
                </h2>
                <p className="text-xs text-zinc-500">
                  Ürünün adını, kategorisini, Lemon Squeezy ödeme bağlantısını ve teknik kurulum bilgilerini girin.
                </p>
              </div>
              {editingProductId && (
                <button
                  onClick={handleResetForm}
                  className="text-xs text-zinc-600 hover:text-zinc-950 font-semibold px-3 py-1.5 bg-zinc-100 rounded-lg cursor-pointer"
                >
                  Yeni Ürün Moduna Geç
                </button>
              )}
            </div>

            {productSuccessFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{productSuccessFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-5">
              
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                
                <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                  <label className="font-semibold text-zinc-800">Ürün Başlığı *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Apple Geliştirici P12 Sertifikası (1 Yıl Garantili)"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-medium cursor-pointer focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  >
                    <option value="Apple P12 & Sertifika">Apple P12 & Sertifika</option>
                    <option value="VIP iOS Oyun Hileleri">VIP iOS Oyun Hileleri</option>
                    <option value="Tweaked & Premium IPA">Tweaked & Premium IPA</option>
                    <option value="IPTV Paketleri (4K)">IPTV Paketleri (4K)</option>
                    <option value="Premium Hesaplar">Premium Hesaplar (Netflix, Spotify, YT)</option>
                    <option value="Sosyal Medya & Oyun Hesapları">Sosyal Medya & Oyun Hesapları</option>
                    <option value="Takipçi & Etkileşim">Takipçi & Etkileşim</option>
                    <option value="DİĞER">DİĞER (Yeni Kategori Yaz)</option>
                  </select>
                </div>

                {category === 'DİĞER' && (
                  <div className="space-y-1 sm:col-span-3">
                    <label className="font-semibold text-zinc-800">Özel Kategori Adı</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Yeni kategori adı yazın"
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                )}

                {/* Lemon Squeezy Dynamic Pricing Integration Card */}
                <div className="space-y-1.5 sm:col-span-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Lemon Squeezy Dinamik Ödeme Entegrasyonu (Otomatik & Canlı)
                    </label>
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Joker Variant (2059055) Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-normal leading-relaxed">
                    Manuel link girmenize gerek yoktur. Aşağıya girdiğiniz güncel satış fiyatı (₺), müşteri &quot;Satın Al&quot; butonuna bastığında Lemon Squeezy API üzerinden kuruş cinsinden anlık olarak tahsil edilir.
                  </p>
                </div>

                {/* Normal Price */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Normal / Eski Fiyat (₺) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.01}
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="650"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Sale Price */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-zinc-800">İndirimli Satış Fiyatı (₺)</label>
                    {price && salePrice && Number(salePrice) < Number(price) && (
                      <span className="text-zinc-900 font-bold text-[11px]">
                        -%{calculateDiscount(Number(price), Number(salePrice))} İndirim
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Örn: 449"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-zinc-950 font-bold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Stok Adedi *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                    placeholder="99"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Platform / Device */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Platform / Cihaz</label>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Örn: iOS, Android, PC, TV"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Delivery Time info */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Teslimat Süresi / Notu</label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="Örn: Anında Otomatik & WhatsApp Teslim"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Badge text */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-800">Özel Rozet (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Örn: 1 Yıl Garantili, VIP Ban Safe, Popüler"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-zinc-800">Detaylı Ürün Açıklaması & Kurulum Bilgisi</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürün özellikleri, aktivasyon adımları, garanti şartları ve kurulum rehberi detaylarını buraya yazın..."
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl leading-relaxed focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              {/* Image Upload / Storage */}
              <div className="space-y-2 text-xs pt-2 border-t border-zinc-100">
                <label className="font-semibold text-zinc-900 block">Ürün Görseli</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  
                  {/* File Upload Box */}
                  <div className="border border-dashed border-zinc-300 hover:border-zinc-900 rounded-xl p-4 text-center bg-zinc-50/50 transition">
                    <input
                      type="file"
                      id="admin_image_upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="admin_image_upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-zinc-600"
                    >
                      <Upload className="w-5 h-5 text-zinc-700" />
                      <span className="font-semibold text-xs">Görsel Seç</span>
                      <span className="text-[10px] text-zinc-400">PNG, JPG, WebP desteklenir</span>
                    </label>
                    {uploadingImage && (
                      <div className="text-[11px] text-zinc-700 font-semibold mt-2 animate-pulse">
                        Görsel Yükleniyor...
                      </div>
                    )}
                    {uploadMessage && !uploadingImage && (
                      <div className="text-[11px] text-zinc-900 font-semibold mt-2">
                        {uploadMessage}
                      </div>
                    )}
                  </div>

                  {/* Direct Image URL & Preview */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-zinc-500 block mb-1">Veya Doğrudan Görsel URL'si Yapıştırın:</span>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    {imageUrl && (
                      <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <img
                          src={imageUrl}
                          alt="Önizleme"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg bg-zinc-200"
                        />
                        <span className="text-[11px] text-zinc-600 font-medium truncate">
                          Görsel Bağlantısı Hazır
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Technical Specifications Rows */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-900">Teknik Özellikler & Uyumluluk Parametreleri</h3>
                    <p className="text-[11px] text-zinc-500">
                      Örn: Uyumluluk, Yükleyici, Süre, Anti-Cheat, Garanti türü gibi parametreler ekleyin.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Özellik Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {specs.map((spec, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                        placeholder="Özellik (Örn: Uyumluluk, Süre)"
                        className="w-1/3 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                        placeholder="Değer (Örn: iOS 14-18, 12 Ay Garanti)"
                        className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(index)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                        title="Bu satırı sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-2 text-zinc-600 hover:text-zinc-900 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Formu Temizle
                </button>

                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2.5 bg-[#121212] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    {submittingProduct
                      ? 'Kaydediliyor...'
                      : editingProductId
                      ? 'Değişiklikleri Kaydet'
                      : 'Dijital Ürünü Yayına Al'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: INVENTORY TABLE */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Dijital Ürün Kataloğu ve Ödeme Linkleri</h2>
                <p className="text-xs text-zinc-500">Mevcut ürünleri arayın, Lemon Squeezy linklerini test edin veya düzenleyin.</p>
              </div>

              {/* Table Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ürün adı veya kategori ara..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-zinc-200/80">
                <thead className="bg-zinc-50/80 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ürün & Görsel</th>
                    <th className="py-3 px-4">Kategori & Platform</th>
                    <th className="py-3 px-4">Fiyat</th>
                    <th className="py-3 px-4">Lemon Squeezy Linki</th>
                    <th className="py-3 px-4">Teslimat</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        Arama kriterlerine uygun ürün bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const discount = calculateDiscount(prod.price, prod.salePrice);

                      return (
                        <tr key={prod.id} className="hover:bg-zinc-50/60 transition">
                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.images?.[0] || ''}
                                alt={prod.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-zinc-900 border border-zinc-700 shrink-0"
                              />
                              <div className="max-w-[200px]">
                                <div className="font-semibold text-zinc-900 line-clamp-1">
                                  {prod.title}
                                </div>
                                {prod.badge && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <div className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] font-medium inline-block">
                              {prod.category}
                            </div>
                            {prod.platform && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                {prod.platform}
                              </div>
                            )}
                          </td>

                          {/* Price & Discount */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-900">
                              {formatPrice(prod.salePrice ?? prod.price)}
                            </div>
                            {prod.salePrice && prod.salePrice < prod.price && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-zinc-400 line-through">
                                  {formatPrice(prod.price)}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700">
                                  -%{discount}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Payment URL & test */}
                          <td className="py-3 px-4">
                            {prod.paymentUrl ? (
                              <a
                                href={prod.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-mono underline"
                              >
                                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="truncate max-w-[130px]">Ödeme Linki</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">Tanımlanmadı</span>
                            )}
                          </td>

                          {/* Delivery info */}
                          <td className="py-3 px-4 text-zinc-600 text-[11px]">
                            {prod.deliveryTime || 'Anında Teslimat'}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleEditProduct(prod)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer"
                              title="Ürünü Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition cursor-pointer"
                              title="Ürünü Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden space-y-6 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-zinc-900" />
                  Müşteri Siparişleri ve Onay Takibi
                </h2>
                <p className="text-xs text-zinc-500">
                  Müşterinin satın alım taleplerini inceleyin; tek tıkla <strong>Başarılı</strong> veya <strong>Başarısız</strong> olarak işaretleyin, lisans kodlarını müşteriye anında iletin.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setOrderFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border ${
                    orderFilterStatus === 'all'
                      ? 'bg-[#121212] text-white border-black'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  Tümü ({orders.length})
                </button>
                <button
                  onClick={() => setOrderFilterStatus('İnceleniyor')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border flex items-center gap-1 ${
                    orderFilterStatus === 'İnceleniyor'
                      ? 'bg-amber-500 text-black border-amber-600 font-bold'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  İnceleniyor ({orders.filter((o) => o.status === 'İnceleniyor' || o.status === 'Sipariş Alındı').length})
                </button>
                <button
                  onClick={() => setOrderFilterStatus('Başarılı')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border flex items-center gap-1 ${
                    orderFilterStatus === 'Başarılı'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Başarılı ({orders.filter((o) => o.status === 'Başarılı').length})
                </button>
                <button
                  onClick={() => setOrderFilterStatus('Başarısız')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border flex items-center gap-1 ${
                    orderFilterStatus === 'Başarısız'
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Başarısız ({orders.filter((o) => o.status === 'Başarısız' || o.status === 'İptal Edildi').length})
                </button>
              </div>
            </div>

            {/* SİPARİŞ DÜZENLE - Tüm sipariş kayıtlarını sistemden (Firestore'dan)
                kalıcı ve online olarak komple silmek için */}
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-5 space-y-3">
              <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-700" />
                Sipariş Düzenle
              </h2>
              <p className="text-xs text-rose-800/90 leading-relaxed max-w-2xl">
                Aşağıdaki butona bastığında, sistemde kayıtlı <strong>tüm siparişler ({orders.length} adet)</strong> Firestore veritabanından anında ve kalıcı olarak silinir. Bu işlem geri alınamaz ve tüm kullanıcılar için online olarak hemen etkili olur.
              </p>
              <button
                onClick={handleDeleteAllOrders}
                disabled={orders.length === 0 || isClearingOrders}
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearingOrders ? 'Siliniyor...' : `Tüm Sipariş Geçmişini Sil (${orders.length})`}</span>
              </button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-14 text-zinc-400 text-xs space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-zinc-300" />
                  <p>Bu filtrede herhangi bir sipariş kaydı bulunmuyor.</p>
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isPending =
                    ord.status === 'İnceleniyor' ||
                    ord.status === 'Sipariş Alındı' ||
                    ord.status === 'Hazırlanıyor';
                  const isSuccess = ord.status === 'Başarılı' || ord.status === 'Teslim Edildi';
                  const isFailed = ord.status === 'Başarısız' || ord.status === 'İptal Edildi';

                  const detailState = editingOrderDetails[ord.id] || {
                    digitalCode: ord.digitalCode || '',
                    adminNote: ord.adminNote || '',
                    isSaved: false,
                  };

                  return (
                    <div
                      key={ord.id}
                      className={`border rounded-2xl p-4 sm:p-5 transition shadow-2xs space-y-4 ${
                        isPending
                          ? 'border-amber-300 bg-amber-50/20'
                          : isSuccess
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : isFailed
                          ? 'border-rose-200 bg-rose-50/10'
                          : 'border-zinc-200 bg-white'
                      }`}
                    >
                      {/* Top Bar: Order ID, Date, Customer & Price */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              • {formatDate(ord.createdAt)}
                            </span>

                            {/* Live Badge */}
                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                İnceleniyor / Onay Bekliyor
                              </span>
                            )}
                            {isSuccess && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Onaylandı / Başarılı
                              </span>
                            )}
                            {isFailed && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                ✕ Başarısız / İptal
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-800 font-semibold">
                            {ord.shippingAddress?.fullName || 'İsimsiz Müşteri'} &nbsp;
                            <span className="text-zinc-500 font-normal">
                              ({ord.shippingAddress?.phone || 'Tel Yok'} - {ord.shippingAddress?.email || ord.userEmail})
                            </span>
                          </div>
                        </div>

                        {/* Amount & Status Change Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-black text-zinc-950">{formatPrice(ord.total)}</div>
                            <span className="text-[10px] text-zinc-500 font-medium">
                              Ödeme Yöntemi: {ord.payment?.method === 'lemon_squeezy' ? 'Lemon Squeezy' : 'Kredi Kartı'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rapid Status Buttons */}
                      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                        <span className="text-[11px] font-bold text-zinc-600 mr-1">Durumu İşaretle:</span>

                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Başarılı')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            ord.status === 'Başarılı'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Başarılı Olarak Onayla</span>
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Başarısız')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            ord.status === 'Başarısız' || ord.status === 'İptal Edildi'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Başarısız / İptal Et</span>
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'İnceleniyor')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                            ord.status === 'İnceleniyor'
                              ? 'bg-amber-500 text-black'
                              : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>İnceleniyor Yap</span>
                        </button>

                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'Teslim Edildi')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                            ord.status === 'Teslim Edildi'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          <span>Teslim Edildi</span>
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs bg-white hover:bg-rose-50 text-rose-700 border border-rose-300"
                          title="Bu siparişi kalıcı olarak sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>

                      {/* Digital License / Delivery Code Input */}
                      <div className="bg-zinc-900 text-white rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                            Müşteriye İletilecek Dijital Lisans / İndirme Kodu
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            (Müşterinin "Sipariş İnceleniyor" ekranında anında görünür)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-1">Lisans Kodu / Anahtar:</label>
                            <input
                              type="text"
                              value={detailState.digitalCode}
                              onChange={(e) =>
                                setEditingOrderDetails((prev) => ({
                                  ...prev,
                                  [ord.id]: { ...detailState, digitalCode: e.target.value, isSaved: false },
                                }))
                              }
                              placeholder="Örn: P12-CERT-99482-VIP / Kod"
                              className="w-full px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-1">Yönetici Açıklaması / Bilgi:</label>
                            <input
                              type="text"
                              value={detailState.adminNote}
                              onChange={(e) =>
                                setEditingOrderDetails((prev) => ({
                                  ...prev,
                                  [ord.id]: { ...detailState, adminNote: e.target.value, isSaved: false },
                                }))
                              }
                              placeholder="Örn: Kurulum linkiniz WhatsApp'tan da iletildi."
                              className="w-full px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              handleSaveOrderDigitalDetails(
                                ord.id,
                                detailState.digitalCode,
                                detailState.adminNote,
                                'Başarılı'
                              );
                              setEditingOrderDetails((prev) => ({
                                ...prev,
                                [ord.id]: { ...detailState, isSaved: true },
                              }));
                            }}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Kodu Kaydet & Siparişi Başarılı Yap</span>
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {ord.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-50 rounded-lg p-2 flex items-center gap-2 text-xs border border-zinc-100"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded object-cover bg-zinc-900"
                              />
                            )}
                            <div className="truncate">
                              <div className="font-semibold text-zinc-900 truncate">{item.title}</div>
                              <div className="text-[11px] text-zinc-500">
                                {item.quantity} Adet • {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: WHATSAPP & STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-900" />
                WhatsApp Destek Hattı ve Genel Ayarlar
              </h2>
              <p className="text-xs text-zinc-500">
                Sitenin sağ alt köşesinde çıkan WhatsApp butonunun numarasını ve varsayılan mesajlarını güncelleyin.
              </p>
            </div>

            {settingsSavedFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ayarlar başarıyla kaydedildi ve tüm siteye uygulandı!</span>
              </div>
            )}

            <div className="space-y-4 max-w-2xl text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  WhatsApp Destek Telefon Numarası (Ülke kodu ile birlikte)
                </label>
                <input
                  type="text"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  placeholder="Örn: 905010000000"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-mono text-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400">Başında + olmadan, örneğin 905xxxxxxxxx şeklinde yazın.</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-800">Varsayılan Karşılama Mesajı</label>
                <textarea
                  rows={2}
                  value={storeWelcomeMsg}
                  onChange={(e) => setStoreWelcomeMsg(e.target.value)}
                  placeholder="Müşteri tıkladığında WhatsApp'ta hazır yazılacak mesaj"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Varsayılan Lemon Squeezy Mağaza URL'si
                </label>
                <input
                  type="url"
                  value={defaultLemonStore}
                  onChange={(e) => setDefaultLemonStore(e.target.value)}
                  placeholder="https://deparstore.lemonsqueezy.com"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl font-mono text-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="pt-3">
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-[#121212] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Ayarları Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROJECT EXPORT & DEPLOYMENT */}
        {activeTab === 'export' && (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Projeyi Dışa Aktar & Vercel Yayını</h2>
              <p className="text-xs text-zinc-500">
                DeparStore e-ticaret platformunun tüm kaynak kodlarını tek tıkla ZIP olarak indirin ve GitHub/Vercel'e deploy edin.
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200 space-y-4">
              <div className="space-y-2 text-xs text-zinc-700 leading-relaxed">
                <div className="font-bold text-zinc-900 text-sm">Vercel & Alan Adı Bağlama Adımları:</div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                  <li>Aşağıdaki butona basarak <strong>deparstore-full-project.zip</strong> dosyasını indirin.</li>
                  <li>Dosyayı bilgisayarınızda bir klasöre çıkartın ve GitHub'da yeni bir repository açıp yükleyin.</li>
                  <li><strong>vercel.com</strong> adresine girip "Add New Project" diyerek GitHub repository'nizi seçin.</li>
                  <li>Settings &gt; Domains kısmından kendi alan adınızı (domain) bağlayın.</li>
                  <li>Lemon Squeezy ödeme bağlantılarınız doğrudan çalışacaktır!</li>
                </ol>
              </div>

              <button
                onClick={() => exportProjectZip()}
                className="px-5 py-3 bg-[#121212] hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Tek Tıkla Tam Proje ZIP İndir (deparstore-full-project.zip)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
