import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { api, Appointment, Customer } from '../services/api';

export const AppointmentsView: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);

  // Slot check state
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('Enterprise PBX Integration Consultation');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [apptsRes, custsRes] = await Promise.all([
        api.listAppointments(),
        api.listCustomers()
      ]);
      setAppointments(apptsRes.data);
      setCustomers(custsRes.data);
      if (custsRes.data.length > 0) {
        setSelectedCustomerId(custsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSlots = async (dateStr: string) => {
    setCheckDate(dateStr);
    try {
      const res = await api.checkAvailableSlots(dateStr);
      setAvailableSlots(res.data.slots);
      if (res.data.slots.length > 0) {
        setSelectedSlotTime(res.data.slots[0].datetime);
      }
    } catch (err) {
      console.error('Failed to check slots', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    handleCheckSlots(checkDate);
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotTime || !selectedCustomerId) {
      alert('Please select a customer and available time slot');
      return;
    }
    try {
      await api.createAppointment({
        customer_id: selectedCustomerId,
        service_name: serviceName,
        scheduled_time: selectedSlotTime,
        duration_minutes: 30,
        location_type: 'ONLINE_VOICE',
        notes: 'Booked via NEXORA Receptionist Console'
      });
      setShowBookModal(false);
      fetchAppointments();
      handleCheckSlots(checkDate);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to book appointment');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.updateAppointment(id, { status: 'CANCELLED', cancellation_reason: 'Cancelled by customer' });
      fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Appointment Management</h1>
          <p className="text-xs text-slate-500">
            Real-time availability checking, booking slots, and automated reminder calls.
          </p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Available Slots Checker Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Check Daily Slot Availability:</span>
            <input
              type="date"
              value={checkDate}
              onChange={(e) => handleCheckSlots(e.target.value)}
              className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>
          <span className="text-[11px] text-slate-500">Autonomous calendar synchronization active</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {availableSlots.map((slot, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border ${
                slot.is_available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{slot.time_display}</span>
              <span className="text-[10px] font-normal">
                {slot.is_available ? '(Available)' : '(Booked)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Appointment #</th>
                <th className="py-3 px-4">Service Details</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No appointments scheduled.</td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{a.appointment_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{a.service_name}</p>
                      <p className="text-[10px] text-slate-400">{a.location_type}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {new Date(a.scheduled_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{a.duration_minutes} mins</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancelAppointment(a.id)}
                          className="text-rose-600 hover:text-rose-800 font-semibold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Book Client Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Slot</label>
                <select
                  value={selectedSlotTime}
                  onChange={(e) => setSelectedSlotTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {availableSlots
                    .filter((s) => s.is_available)
                    .map((s, idx) => (
                      <option key={idx} value={s.datetime}>
                        {checkDate} at {s.time_display}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
