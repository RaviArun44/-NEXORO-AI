import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  MapPin, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  CreditCard, 
  Volume2, 
  ArrowLeft 
} from 'lucide-react';
import { api, Order } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CustomerOrdersViewProps {
  onBackToStore: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ onBackToStore }) => {
  const { customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.getMyOrders();
        setOrders(res.data);
      } catch (e) {
        console.error("Failed to fetch customer orders", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store Catalog</span>
        </button>

        <div className="text-right">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-xs font-bold text-slate-900">{customer?.name} ({customer?.customer_code})</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">My Orders & AI Voice Confirmations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track live order lifecycle stages and review autonomous multilingual voice call outcomes.
            </p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
            {orders.length} Total Orders
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your order history...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
            <button
              onClick={onBackToStore}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Start Shopping Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-blue-200 transition-colors space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-200/70 pb-3">
                  <div>
                    <span className="font-mono font-black text-sm text-slate-900">{ord.order_number}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      {new Date(ord.created_at).toLocaleDateString()} at {new Date(ord.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ord.status === 'ORDER_CONFIRMED' || ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                    <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {ord.payment_method}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  {(ord.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {it.quantity}x
                        </span>
                        <span className="font-semibold text-slate-800">{it.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{(it.unit_price * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* AI Call Outcome Section */}
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-900">Autonomous AI Confirmation Call</p>
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase">
                          {ord.preferred_language || 'EN'} VOICE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ord.ai_call_summary || 'AI call scheduled automatically.'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                      ord.customer_confirmed === true
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ord.customer_confirmed === false
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {ord.customer_confirmed === true ? '✓ Order Confirmed by Voice' : ord.customer_confirmed === false ? '✕ Cancelled by Voice' : '⏳ Awaiting Call'}
                  </span>
                </div>

                {/* Total & Delivery Address */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-sm">{ord.shipping_address}</span>
                  </div>
                  <div>
                    <span>Total Paid: </span>
                    <span className="text-sm font-black text-slate-900">₹{Number(ord.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

