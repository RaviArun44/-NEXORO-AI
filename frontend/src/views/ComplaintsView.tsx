import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, CheckCircle2, Clock, X, ShieldAlert } from 'lucide-react';
import { api, Complaint, Customer } from '../services/api';

export const ComplaintsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState<string>('');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Product Issue');
  const [priority, setPriority] = useState('MEDIUM');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [compRes, custRes] = await Promise.all([
        api.listComplaints(),
        api.listCustomers()
      ]);
      setComplaints(compRes.data);
      setCustomers(custRes.data);
      if (custRes.data.length > 0) {
        setCustomerId(custRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createComplaint({
        customer_id: customerId,
        title,
        description,
        category,
        priority
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create complaint ticket');
    }
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      await api.updateComplaint(selectedComplaint.id, {
        status: 'RESOLVED',
        resolution_notes: resolutionText
      });
      setSelectedComplaint(null);
      setResolutionText('');
      fetchComplaints();
    } catch (err) {
      console.error('Failed to resolve complaint', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Complaints & Escalation Desk</h1>
          <p className="text-xs text-slate-500">
            Registered customer complaints, urgent escalations, and automated dispute tracking.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Complaint</span>
        </button>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Issue Title & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading complaints...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No open complaints.</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{c.ticket_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{c.title}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-sm">{c.description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : c.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'RESOLVED' || c.status === 'CLOSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setResolutionText(c.resolution_notes || '');
                          }}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          Resolve Ticket
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Complaint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Register Customer Complaint</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed Delivery to Chennai"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Product Issue">Product Issue</option>
                    <option value="Delayed Delivery">Delayed Delivery</option>
                    <option value="Billing Dispute">Billing Dispute</option>
                    <option value="Service Quality">Service Quality</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Complaint Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe customer issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">
                Resolve Ticket: {selectedComplaint.ticket_number}
              </h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Issue:</span>
                <p className="text-slate-600 mt-0.5">{selectedComplaint.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain resolution provided to customer..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveComplaint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
