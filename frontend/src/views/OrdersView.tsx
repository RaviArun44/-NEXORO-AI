import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Truck, CheckCircle2, Clock, X, PackageCheck } from 'lucide-react';
import { api, Order } from '../services/api';

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.listOrders({ status: statusFilter || undefined });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Order Management & Tracking</h1>
          <p className="text-xs text-slate-500">
            Live order fulfillment, tracking lookup, and automated status notifications via phone.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        {['', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Orders'}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Items Breakdown</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Tracking & Courier</th>
                <th className="py-3 px-4">Fulfillment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {o.items.map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {o.currency} {Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <div>
                          <p className="font-mono font-medium text-slate-700">{o.tracking_number || 'Pending'}</p>
                          <p className="text-[10px] text-slate-400">{o.courier_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'SHIPPED'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">
                Order Tracking: {selectedOrder.order_number}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 font-medium">Payment Status:</span>
                  <p className="font-bold text-emerald-700">{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Total Amount:</span>
                  <p className="font-mono font-bold text-slate-800">
                    {selectedOrder.currency} {Number(selectedOrder.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Tracking Number:</span>
                  <p className="font-mono font-bold text-blue-700">{selectedOrder.tracking_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Carrier Service:</span>
                  <p className="font-medium text-slate-700">{selectedOrder.courier_name}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <span className="font-semibold text-slate-700">Delivery Address:</span>
                  <p className="text-slate-500 mt-0.5">{selectedOrder.shipping_address}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
