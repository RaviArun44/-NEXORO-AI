import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Headphones,
  UserCheck,
  ShieldAlert,
  ShoppingBag,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  AtSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

export const AuthView: React.FC = () => {
  const { login, register, forgotPassword, resetPassword, setPortalMode } = useAuth();

  // Role Modes: CUSTOMER, AGENT, ADMIN
  const [roleMode, setRoleMode] = useState<'CUSTOMER' | 'AGENT' | 'ADMIN'>('CUSTOMER');

  // Form Modes: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // Login Form State
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('john_miller');
  const [loginPassword, setLoginPassword] = useState<string>('Customer@123');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Registration Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regAdminKey, setRegAdminKey] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Forgot / Reset Password State
  const [forgotIdent, setForgotIdent] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Feedback State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-Fill Verified Demo Credentials
  const handleAutoFill = (role: 'CUSTOMER' | 'AGENT' | 'ADMIN') => {
    setError('');
    setSuccessMsg('');
    if (role === 'CUSTOMER') {
      setUsernameOrEmail('john_miller');
      setLoginPassword('Customer@123');
    } else if (role === 'AGENT') {
      setUsernameOrEmail('agent');
      setLoginPassword('Agent@123');
    } else {
      setUsernameOrEmail('admin');
      setLoginPassword('Admin@123');
    }
  };

  const handleRoleChange = (newRole: 'CUSTOMER' | 'AGENT' | 'ADMIN') => {
    setRoleMode(newRole);
    setError('');
    setSuccessMsg('');
    setAuthMode('login');
    handleAutoFill(newRole);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both your Username/Email and Password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await login(
      usernameOrEmail.trim(),
      loginPassword.trim(),
      roleMode,
      rememberMe
    );

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    }
    setLoading(false);
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Field Validations
    if (!regFullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!regUsername.trim()) {
      setError('Username is required.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(regUsername.trim())) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!regPhone.trim()) {
      setError('Mobile Phone Number is required.');
      return;
    }
    const cleanDigits = regPhone.replace(/\D/g, '');
    if (cleanDigits.length < 7) {
      setError('Please provide a valid phone number (minimum 7 digits).');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (roleMode === 'ADMIN' && regAdminKey.trim() !== 'NEXORA_ADMIN_SECURE_2026') {
      setError('Invalid Admin Security Key. Authorized setup key is required for administrator accounts.');
      return;
    }

    setLoading(true);

    const res = await register({
      full_name: regFullName.trim(),
      username: regUsername.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      password: regPassword,
      confirm_password: regConfirmPassword,
      role: roleMode,
      admin_key: roleMode === 'ADMIN' ? regAdminKey.trim() : undefined
    });

    if (res.success) {
      setSuccessMsg('Account registered successfully! Redirecting to your dashboard...');
    } else {
      setError(res.error || 'Registration failed. Username or email may already be registered.');
    }
    setLoading(false);
  };

  // Submit Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdent.trim()) {
      setError('Please enter your registered Username or Email.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await forgotPassword(forgotIdent.trim());
    if (res.success) {
      setSuccessMsg(res.message || 'Verification code sent.');
      if (res.resetCode) setResetCode(res.resetCode);
      setAuthMode('reset');
    } else {
      setError(res.error || 'Account not found.');
    }
    setLoading(false);
  };

  // Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await resetPassword({
      email_or_username: forgotIdent.trim(),
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
      reset_code: resetCode.trim()
    });

    if (res.success) {
      setSuccessMsg('Password reset successful! Please sign in with your new credentials.');
      setUsernameOrEmail(forgotIdent.trim());
      setLoginPassword(newPassword);
      setAuthMode('login');
    } else {
      setError(res.error || 'Failed to reset password.');
    }
    setLoading(false);
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
              Select Your Access Portal
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleChange('CUSTOMER')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  roleMode === 'CUSTOMER'
                    ? 'bg-white text-blue-600 shadow-xs ring-1 ring-blue-500/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('AGENT')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  roleMode === 'AGENT'
                    ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>Agent Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  roleMode === 'ADMIN'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Suite</span>
              </button>
            </div>
          </div>

          {/* Dynamic Role Explanation Banner */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900">
              {roleMode === 'CUSTOMER' && (
                <span>
                  <strong>Customer Voice & Shopping Portal:</strong> Sign in with your registered username/email to connect with your AI receptionist and manage orders.
                </span>
              )}
              {roleMode === 'AGENT' && (
                <span>
                  <strong>Agent Operator Desk:</strong> Dedicated console for customer service agents to accept inbound call requests and manage live transfers.
                </span>
              )}
              {roleMode === 'ADMIN' && (
                <span>
                  <strong>Enterprise Administration:</strong> Full administrative control, catalog governance, telephony management, and real-time operational analytics.
                </span>
              )}
            </div>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. LOGIN MODE                                            */}
          {/* ======================================================== */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username or Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={
                      roleMode === 'CUSTOMER'
                        ? 'e.g. john_miller or john.miller@example.com'
                        : roleMode === 'AGENT'
                        ? 'e.g. agent or agent@nexora.ai'
                        : 'e.g. admin or admin@nexora.ai'
                    }
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdent(usernameOrEmail);
                      setAuthMode('forgot');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-[11px]">Remember me on this browser</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-3 font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 text-white ${
                  roleMode === 'CUSTOMER'
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700'
                    : roleMode === 'AGENT'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900'
                }`}
              >
                <span>
                  {loading
                    ? 'Verifying Credentials...'
                    : roleMode === 'CUSTOMER'
                    ? 'Enter Customer Dashboard'
                    : roleMode === 'AGENT'
                    ? 'Sign In to Agent Console'
                    : 'Sign In to Admin Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Auto-Fill Demo Accounts */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center space-y-2">
                <button
                  type="button"
                  onClick={() => handleAutoFill(roleMode)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Auto-fill verified demo {roleMode.toLowerCase()} credentials
                  </span>
                </button>

                {/* Create Account Link */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold cursor-pointer"
                >
                  {roleMode === 'ADMIN'
                    ? 'Need an administrator account? Setup Authorized Admin'
                    : "Don't have an account? Create New Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setPortalMode('customer')}
                  className="w-full mt-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                  <span>Explore Public E-Commerce Store</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. REGISTRATION / SIGN UP MODE                           */}
          {/* ======================================================== */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">
                  Create {roleMode === 'CUSTOMER' ? 'Customer' : roleMode === 'AGENT' ? 'Agent Desk' : 'Administrator'} Account
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-blue-600 font-semibold text-xs hover:underline cursor-pointer"
                >
                  Sign In instead
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username * (Unique ID)
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_miller99"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.miller@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Phone Number * (Mandatory Validation)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1-415-555-0142 or +91-98765-43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password * (Min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-10 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 ${
                      regConfirmPassword && regPassword !== regConfirmPassword
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              {/* Admin Setup Key (Strictly required for Admin Role) */}
              {roleMode === 'ADMIN' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <label className="block font-semibold text-amber-900 mb-1 flex items-center space-x-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin Security Setup Key *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter NEXORA Admin Key"
                    value={regAdminKey}
                    onChange={(e) => setRegAdminKey(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    Security requirement: Admin accounts cannot be created publicly. Enter <code>NEXORA_ADMIN_SECURE_2026</code>.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Creating Account...' : 'Register & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. FORGOT PASSWORD MODE                                  */}
          {/* ======================================================== */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Reset Your Password</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Enter your registered username or email address to receive password reset instructions.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registered Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_miller or john@example.com"
                    value={forgotIdent}
                    onChange={(e) => setForgotIdent(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Verifying...' : 'Send Password Reset Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Remember your password? Return to login
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 4. RESET PASSWORD MODE                                   */}
          {/* ======================================================== */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Enter New Password</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Verification code has been verified for <strong>{forgotIdent}</strong>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reset Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 849201"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{loading ? 'Updating Password...' : 'Save Password & Sign In'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel and return to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
