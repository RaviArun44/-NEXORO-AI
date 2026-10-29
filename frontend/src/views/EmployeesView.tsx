import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Phone, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { api, User } from '../services/api';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.listEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.updateEmployeeStatus(userId, newStatus);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to update employee status', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Employee Management & Department Routing</h1>
          <p className="text-xs text-slate-500">
            Available human specialists for live AI call handoffs and department transfers.
          </p>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {emp.full_name ? emp.full_name[0] : 'E'}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  emp.status === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : emp.status === 'BUSY'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  ● {emp.status}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-800 mt-3">{emp.full_name}</h3>
              <p className="text-xs text-blue-600 font-medium">{emp.department}</p>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ext: <b className="font-mono text-slate-700">{emp.extension}</b></span>
                </p>
              </div>
            </div>

            {/* Presence Status Toggle Bar */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Presence Status
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-medium text-slate-600">
                {['AVAILABLE', 'BUSY', 'OFFLINE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(emp.id, st)}
                    className={`py-1 rounded-lg transition-all cursor-pointer ${
                      emp.status === st
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {st.slice(0, 5)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
