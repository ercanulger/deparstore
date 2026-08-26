import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const { userProfile, user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'İnceleniyor':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'Başarılı':
      case 'Teslim Edildi':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      case 'Başarısız':
      case 'İptal Edildi':
        return 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
      case 'Sipariş Alındı':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      case 'Hazırlanıyor':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-200 flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-zinc-900">Sipariş Geçmişim</h2>
              <p className="text-[11px] text-zinc-500">
                Verdiğiniz tüm siparişlerin güncel durumunu buradan takip edebilirsiniz.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-zinc-400">
              <Package className="w-12 h-12 mx-auto text-zinc-300" />
              <h3 className="font-bold text-zinc-700 text-sm">Henüz Siparişiniz Bulunmuyor</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Mağazamızdan ürün seçip sipariş verdiğinizde burada anlık olarak listelenecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    className="border border-zinc-200 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 transition-all bg-white shadow-xs space-y-4"
                  >
                    {/* Top Row: Order Number, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-zinc-400">• {formatDate(order.createdAt)}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Teslim Alan: <strong>{order.shippingAddress.fullName}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-lg border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-sm font-extrabold text-zinc-900">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items Preview */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                              />
                            )}
                            <div className="truncate">
                              <span className="font-medium text-zinc-800">{item.title}</span>
                              <span className="text-zinc-400 ml-1">x {item.quantity}</span>
                            </div>
                          </div>
                          <span className="font-bold text-zinc-900 shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tracking number info if available */}
                    {order.trackingNumber && (
                      <div className="p-2.5 bg-indigo-50/60 rounded-xl text-xs flex items-center justify-between text-indigo-900">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-600" />
                          <span>Kargo Takip No: <strong className="font-mono">{order.trackingNumber}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
