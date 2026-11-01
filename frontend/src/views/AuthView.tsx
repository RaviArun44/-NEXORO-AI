import React, { useState } from 'react';
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, Sparkles, Headphones, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

export const AuthView: React.FC = () => {
  const { login, userLogin, register } = useAuth();
  const [roleMode, setRoleMode] = useState<'CUSTOMER' | 'AGENT' | 'ADMIN'>('CUSTOMER');
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Customer credentials (Name, Gmail, Mobile number)
  const [customerName, setCustomerName] = useState<string>('John Miller');
  const [customerEmail, setCustomerEmail] = useState<string>('john.miller@example.com');
  const [customerPhone, setCustomerPhone] = useState<string>('+1-415-555-0142');

  // Staff credentials (Email & Password)
  const [email, setEmail] = useState<string>('admin@nexora.ai');
  const [password, setPassword] = useState<string>('Admin@123');
  const [fullName, setFullName] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleRoleChange = (newRole: 'CUSTOMER' | 'AGENT' | 'ADMIN') => {
    setRoleMode(newRole);
    setError('');
    setIsRegister(false);
    if (newRole === 'CUSTOMER') {
      setCustomerName('John Miller');
      setCustomerEmail('john.miller@example.com');
      setCustomerPhone('+1-415-555-0142');
    } else if (newRole === 'AGENT') {
      setEmail('agent@nexora.ai');
      setPassword('Agent@123');
    } else {
      setEmail('admin@nexora.ai');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (roleMode === 'CUSTOMER') {
        // Customer login requiring Name, Gmail, and Mobile number
        if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
          setError('Please provide your name, Gmail/email, and mobile number.');
          setLoading(false);
          return;
        }
        const ok = await userLogin({
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        });
        if (!ok) {
          setError('Failed to initialize customer session. Please verify details.');
        }
      } else {
        // AI Agent or Admin login
        if (isRegister) {
          const ok = await register({
            email,
            password,
            full_name: fullName || (roleMode === 'ADMIN' ? 'Enterprise Administrator' : 'Voice Operations Specialist'),
            phone: staffPhone || undefined,
            department: roleMode === 'ADMIN' ? 'Management & IT' : 'Customer Voice Reception',
            role: roleMode
          });
          if (!ok) {
            setError('Registration failed. Email may already be registered.');
          }
        } else {
          const ok = await login(email, password);
          if (!ok) {
            setError('Invalid credentials. Please verify your email and password.');
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check your network or credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Company Header Branding */}
        <div className="flex justify-center mb-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs inline-flex items-center justify-center">
            <img
              src="/kaira-logo.png"
              alt="KAIRA Technologies"
              className="h-12 w-auto max-w-[220px] object-contain drop-shadow-xs"
            />
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <NexoraAvatar size="md" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          NEXORA AI
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Intelligent Multilingual AI Receptionist & Enterprise Communication Platform
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-8">
          {/* Three Separate Role Navigation Tabs */}
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Select Portal / Experience
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleRoleChange('CUSTOMER')}
                className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${roleMode === 'CUSTOMER'
                    ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="text-[11px] truncate">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('AGENT')}
                className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${roleMode === 'AGENT'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Headphones className="w-4 h-4" />
                <span className="text-[11px] truncate">AI Agent</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${roleMode === 'ADMIN'
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] truncate">Admin</span>
              </button>
            </div>
          </div>

          {/* Mode Subtitle Description */}
          <div className="mb-4 p-2.5 rounded-xl text-xs flex items-center justify-between border bg-slate-50 border-slate-200/70">
            <div>
              <p className="font-bold text-slate-800">
                {roleMode === 'CUSTOMER' && 'Customer Self-Service Voice Portal'}
                {roleMode === 'AGENT' && 'AI Agent Telephony & Receptionist Console'}
                {roleMode === 'ADMIN' && 'Company Owner & Executive Dashboard'}
              </p>
              <p className="text-[11px] text-slate-500">
                {roleMode === 'CUSTOMER' && 'Speak live with AI, track orders, book demo appointments'}
                {roleMode === 'AGENT' && 'Handle real-time incoming call requests, transcripts & handoffs'}
                {roleMode === 'ADMIN' && 'Manage KPIs, RAG knowledge base, inventory & SIP settings'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* 1. CUSTOMER PORTAL LOGIN: Name, Gmail, Mobile Number */}
            {roleMode === 'CUSTOMER' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gmail / Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1-415-555-0142 or +91-98401-23456"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 2. AGENT & ADMIN LOGIN: Email & Password */}
            {roleMode !== 'CUSTOMER' && (
              <>
                {isRegister && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Staff Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder={roleMode === 'ADMIN' ? 'Alex Mercer' : 'Sarah Chen'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {roleMode === 'ADMIN' ? 'Administrator Email' : 'AI Agent Extension Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder={roleMode === 'ADMIN' ? 'admin@nexora.ai' : 'agent@nexora.ai'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-3 font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-white ${roleMode === 'CUSTOMER'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700'
                  : roleMode === 'AGENT'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900'
                }`}
            >
              <span>
                {loading
                  ? 'Connecting...'
                  : roleMode === 'CUSTOMER'
                    ? 'Enter Customer Dashboard'
                    : isRegister
                      ? 'Create Staff Account'
                      : `Sign In to ${roleMode === 'AGENT' ? 'Agent Console' : 'Admin Dashboard'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Auto-Fill Demo Accounts */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => {
                if (roleMode === 'CUSTOMER') {
                  setCustomerName('John Miller');
                  setCustomerEmail('john.miller@example.com');
                  setCustomerPhone('+1-415-555-0142');
                } else if (roleMode === 'AGENT') {
                  setEmail('agent@nexora.ai');
                  setPassword('Agent@123');
                } else {
                  setEmail('admin@nexora.ai');
                  setPassword('Admin@123');
                }
                setError('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Auto-fill verified demo {roleMode.toLowerCase()} credentials
              </span>
            </button>

            {roleMode !== 'CUSTOMER' && (
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {isRegister ? 'Already registered? Sign in instead' : "Need a new account? Register now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
