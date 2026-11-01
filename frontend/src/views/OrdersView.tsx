import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  X, 
  PackageCheck,
  PhoneCall,
  RotateCcw,
  Eye,
  Globe,
  AlertCircle
} from 'lucide-react';
import { api, Order } from '../services/api';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [callTriggerLoading, setCallTriggerLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders({ 
        status: statusFilter || undefined,
        search: searchTerm || undefined
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleTriggerAICall = async (orderId: string) => {
    try {
      setCallTriggerLoading(orderId);
      await api.triggerAIOrderCall(orderId, 'CONFIRMED');
      await fetchOrders();
    } catch (err) {
      console.error('Failed to trigger AI call', err);
    } finally {
      setCallTriggerLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrder(orderId, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span>Customer Orders & AI Call Fulfillment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-marketplace orders, payment verification, and automated outbound voice confirmation.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer self-start transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order ID (e.g. ORD-2026-00001), Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {['', 'ORDER_CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st ? st.replace(/_/g, ' ') : 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">AI Call Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => {
                  const items = o.items || [];
                  const mainProduct = items[0]?.name || 'Product';
                  const totalQty = items.reduce((acc, it) => acc + (it.quantity || 1), 0);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {o.order_number}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{o.customer_name || 'Valued Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{o.customer_phone}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="truncate font-semibold text-slate-800">{mainProduct}</p>
                        {items.length > 1 && (
                          <span className="text-[10px] text-slate-400">+{items.length - 1} more items</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{Number(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.payment_status} ({o.payment_method})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'ORDER_CONFIRMED' || o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center space-x-1 w-fit ${
                            o.ai_call_status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.ai_call_status === 'NOT_ANSWERED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <PhoneCall className="w-3 h-3 mr-0.5" />
                          <span>{o.ai_call_status || 'PENDING'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                            title="View Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleTriggerAICall(o.id)}
                            disabled={callTriggerLoading === o.id}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer disabled:opacity-50"
                            title="Trigger / Retry Outbound AI Voice Confirmation Call"
                          >
                            <PhoneCall className={`w-3.5 h-3.5 ${callTriggerLoading === o.id ? 'animate-bounce' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Logistics Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Order Overview: {selectedOrder.order_number}</h3>
                <p className="text-[11px] text-blue-100">
                  {selectedOrder.customer_name} • Total: ₹{Number(selectedOrder.total_amount).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Delivery Address */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Delivery Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedOrder.shipping_address}</p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Courier: <strong>{selectedOrder.courier_name}</strong> • Tracking: <span className="font-mono text-blue-600">{selectedOrder.tracking_number}</span>
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Ordered Products</p>
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">{it.name} (x{it.quantity})</span>
                    <span className="font-bold text-slate-900">₹{(it.unit_price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* AI Confirmation Call Log Summary */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-900 text-xs">
                    <PhoneCall className="w-4 h-4 text-blue-600" />
                    <span>AI Voice Confirmation Call</span>
                  </div>
                  <span className="bg-blue-200/80 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {selectedOrder.preferred_language || 'EN'}
                  </span>
                </div>
                <p className="text-slate-700 font-medium">
                  {selectedOrder.ai_call_summary || 'AI call scheduled automatically upon order creation.'}
                </p>
              </div>

              {/* Status Updater */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-semibold">Change Status:</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="ORDER_PLACED">Order Placed</option>
                    <option value="ORDER_CONFIRMED">Order Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
