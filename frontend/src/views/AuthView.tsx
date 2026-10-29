import React, { useState } from 'react';
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('admin@nexora.ai');
  const [password, setPassword] = useState<string>('Admin@123');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegister) {
      const ok = await register({
        email,
        password,
        full_name: fullName || 'Enterprise Staff',
        phone: phone || undefined,
        department: 'Customer Support',
        role: 'ADMIN'
      });
      if (!ok) {
        setError('Registration failed. Please check your credentials or if email is already in use.');
      }
    } else {
      const ok = await login(email, password);
      if (!ok) {
        setError('Invalid email or password. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleFillDemo = () => {
    setIsRegister(false);
    setEmail('admin@nexora.ai');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm inline-flex items-center justify-center">
            <img
              src="/kaira-logo.png"
              alt="KAIRA Technologies"
              className="h-14 w-auto max-w-[240px] object-contain drop-shadow-xs"
            />
          </div>
        </div>
        <div className="flex justify-center mb-3">
          <NexoraAvatar size="lg" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          NEXORA AI
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Intelligent Multilingual Virtual Receptionist & Communication Suite
        </p>
        <div className="inline-flex items-center space-x-1.5 mt-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
          <span>Engineered & Built by</span>
          <span className="font-bold">KAIRA Technologies</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@nexora.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="+1-800-555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Login Shortcut */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Click to auto-fill default admin credentials</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {isRegister ? 'Already registered? Sign in instead' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

