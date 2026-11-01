import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Globe, 
  LogOut, 
  Shield, 
  Package, 
  ChevronDown, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../services/api';

interface CustomerNavbarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  preferredLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenAuth,
  onOpenOrders,
  preferredLanguage,
  onLanguageChange
}) => {
  const { customer, customerLogout, cartCount, user, setPortalMode } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];

  const currentLangObj = LANGUAGES.find(l => l.code === preferredLanguage) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white text-xs py-1.5 px-4 font-medium flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide">
              AI-POWERED
            </span>
            <span className="hidden sm:inline">
              Free Express Delivery on orders above ₹499 • Autonomous AI Voice Order Confirmation in 5 Indian Languages
            </span>
            <span className="sm:hidden">Free Express Delivery & AI Voice Calls</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={() => setPortalMode('admin')}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
              title="Click to open Admin Management Portal"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>{user ? 'Admin Dashboard' : 'Admin Login'}</span>
            </button>
            <span className="hidden md:inline text-blue-100">Helpline: +91-80-6000-4400</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
              NEXORO <span className="text-blue-600">STORE</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Khaira Unified E-Commerce Organization
            </p>
          </div>
        </div>

        {/* Global Product Search */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search across 16 categories: Smartphones, Laptops, Fashion, Kitchen, Appliances..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Preferred Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              title="Change Voice & Display Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLangObj.native}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                  AI Voice & Calling Language
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLanguageChange(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 cursor-pointer ${
                      preferredLanguage === l.code ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[11px] font-normal text-slate-400">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Admin Portal Quick Switch */}
          <button
            onClick={() => setPortalMode('admin')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200/90 cursor-pointer transition-colors shadow-2xs"
            title="Switch to Admin Login & Operations Portal"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Admin Portal</span>
          </button>

          {/* Customer Profile / Sign In */}
          {customer ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold hover:bg-blue-100 cursor-pointer transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {customer.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[11px] font-bold leading-tight">{customer.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-blue-600 font-mono leading-none">{customer.customer_code}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-blue-600" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-900">{customer.name}</p>
                    <p className="text-[10px] text-slate-500">{customer.phone}</p>
                    <div className="mt-1 inline-block bg-slate-100 text-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded-sm">
                      {customer.customer_code}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenOrders();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>My Orders & AI Voice Calls</span>
                  </button>

                  <button
                    onClick={() => {
                      customerLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Sign In</span>
            </button>
          )}

          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <nav className="bg-slate-50/80 border-t border-slate-200/60 overflow-x-auto no-scrollbar py-2 px-4">
        <div className="container mx-auto flex items-center space-x-2 text-xs font-medium">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All 16 Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer transition-colors ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

