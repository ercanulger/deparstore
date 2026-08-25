import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minAmount?: number;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'INDIRIM20', type: 'percent', value: 20, minAmount: 200 },
  { code: 'HOSGELDIN10', type: 'percent', value: 10 },
  { code: 'FIRSAT50', type: 'fixed', value: 50, minAmount: 300 },
  { code: 'ADMINSPECIAL', type: 'percent', value: 25 },
];

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  totalSavings: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nova_store_cart_v1';
const FREE_SHIPPING_THRESHOLD = 500;
const STANDARD_SHIPPING_FEE = 49.90;

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        // Check stock boundary
        if (product.stock && newQty > product.stock) {
          updated[existingIndex].quantity = product.stock;
        } else {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      }
      const initialQty = product.stock ? Math.min(quantity, product.stock) : quantity;
      return [...prev, { product, quantity: initialQty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock || 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Subtotal calculation
  const subtotal = items.reduce((acc, item) => {
    const currentPrice = item.product.salePrice ?? item.product.price;
    return acc + currentPrice * item.quantity;
  }, 0);

  // Total savings from product discounts
  const totalSavings = items.reduce((acc, item) => {
    if (item.product.salePrice && item.product.salePrice < item.product.price) {
      const unitSavings = item.product.price - item.product.salePrice;
      return acc + unitSavings * item.quantity;
    }
    return acc;
  }, 0);

  // Shipping fee
  const shippingFee = items.length === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = AVAILABLE_COUPONS.find((c) => c.code === cleanCode);
    if (!found) {
      return { success: false, message: 'Geçersiz kupon kodu. (Örn: INDIRIM20, HOSGELDIN10)' };
    }
    if (found.minAmount && subtotal < found.minAmount) {
      return {
        success: false,
        message: `Bu kupon en az ${found.minAmount} ₺ tutarındaki sepetlerde geçerlidir.`,
      };
    }
    setAppliedCoupon(found);
    return {
      success: true,
      message: `Tebrikler! ${found.code} kuponu uygulandı (${found.type === 'percent' ? `%${found.value}` : `${found.value} ₺`} indirim).`,
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        totalSavings,
        shippingFee,
        discountAmount,
        total,
        itemCount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
