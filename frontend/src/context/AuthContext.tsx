import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, CustomerProfile } from '../services/api';

interface AuthContextType {
  // Admin Session
  user: User | null;
  adminToken: string | null;
  adminLogin: (usernameOrEmail: string, password: string, role?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  adminRegister: (data: any) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;

  // Customer Session
  customer: CustomerProfile | null;
  customerToken: string | null;
  customerLogin: (identifier: string, password: string) => Promise<boolean>;
  customerRegister: (data: any) => Promise<boolean>;
  customerLogout: () => void;
  refreshCustomer: () => Promise<void>;

  // Customer Portal 10-Digit & Universal Auth
  customerPortalLogin: (identifier: string, password: string) => Promise<boolean>;
  customerPortalRegister: (data: { name: string; email: string; phone: string; password: string; preferred_language?: string }) => Promise<boolean>;

  // Portal State & Navigation
  portalMode: 'admin' | 'customer';
  setPortalMode: (mode: 'admin' | 'customer') => void;
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  pendingHandoffsCount: number;
  setPendingHandoffsCount: React.Dispatch<React.SetStateAction<number>>;

  // Unified Role-Based Auth
  token: string | null;
  login: (usernameOrEmail: string, password: string, role?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  userLogin: (data: { name: string; email: string; phone: string }) => Promise<boolean>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (emailOrUsername: string) => Promise<{ success: boolean; message?: string; resetCode?: string; error?: string }>;
  resetPassword: (data: { email_or_username: string; new_password: string; confirm_new_password: string; reset_code?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('nexora_token'));
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem('nexora_customer_token'));
  
  const [portalMode, setPortalModeState] = useState<'admin' | 'customer'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('portal');
    if (param === 'admin' || window.location.hash.toLowerCase().includes('admin')) {
      return 'admin';
    }
    if (param === 'customer' || window.location.hash.toLowerCase().includes('customer')) {
      return 'customer';
    }
    return (localStorage.getItem('nexora_portal_mode') as 'admin' | 'customer') || 'customer';
  });
  
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingHandoffsCount, setPendingHandoffsCount] = useState<number>(0);

  const setPortalMode = (mode: 'admin' | 'customer') => {
    localStorage.setItem('nexora_portal_mode', mode);
    window.location.hash = mode;
    setPortalModeState(mode);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('customer') || hash.includes('store')) {
        setPortalModeState('customer');
      } else if (hash.includes('admin')) {
        setPortalModeState('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize and validate active sessions
  useEffect(() => {
    const initSessions = async () => {
      // 1. Validate Admin / User Session
      const savedAdminToken = localStorage.getItem('nexora_token');
      if (savedAdminToken) {
        try {
          const res = await api.getMe();
          setUser(res.data);
          setAdminToken(savedAdminToken);
        } catch (err) {
          console.warn("Session expired or invalid:", err);
          localStorage.removeItem('nexora_token');
          localStorage.removeItem('nexora_admin_token');
          setAdminToken(null);
          setUser(null);
        }
      }

      // 2. Validate Customer Session
      const savedCustomerToken = localStorage.getItem('nexora_customer_token');
      if (savedCustomerToken) {
        try {
          const res = await api.getCustomerProfile();
          setCustomer(res.data);
          setCustomerToken(savedCustomerToken);

          const cartRes = await api.getCart();
          setCartCount(cartRes.data?.total_items || 0);
        } catch (err) {
          console.warn("Customer session invalid:", err);
          localStorage.removeItem('nexora_customer_token');
          setCustomerToken(null);
          setCustomer(null);
          setCartCount(0);
        }
      }

      setLoading(false);
    };

    initSessions();
  }, []);

  // Universal Role & Admin Auth Handlers
  const adminLogin = async (
    usernameOrEmail: string,
    password: string,
    role?: string,
    rememberMe?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.login({
        username_or_email: usernameOrEmail,
        password,
        role,
        remember_me: rememberMe
      });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      localStorage.setItem('nexora_admin_token', access_token);
      setAdminToken(access_token);
      setUser(loggedUser);
      setPortalMode('admin');
      return { success: true };
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Invalid credentials. Please verify your username/email and password.";
      return { success: false, error: detail };
    }
  };

  const adminRegister = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.register(data);
      const { access_token, user: registeredUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      localStorage.setItem('nexora_admin_token', access_token);
      setAdminToken(access_token);
      setUser(registeredUser);
      setPortalMode('admin');
      return { success: true };
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Registration failed. Please check your information.";
      return { success: false, error: detail };
    }
  };

  const forgotPassword = async (emailOrUsername: string) => {
    try {
      const res = await api.forgotPassword({ email_or_username: emailOrUsername });
      return { success: true, message: res.data.message, resetCode: res.data.reset_code };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || "Failed to initiate password reset." };
    }
  };

  const resetPassword = async (data: any) => {
    try {
      const res = await api.resetPassword(data);
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || "Failed to reset password." };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_admin_token');
    setAdminToken(null);
    setUser(null);
  };

  // Customer Auth Handlers
  const customerLogin = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const res = await api.customerLogin({ identifier, password });
      const { access_token, customer: loggedCustomer } = res.data;
      localStorage.setItem('nexora_customer_token', access_token);
      setCustomerToken(access_token);
      setCustomer(loggedCustomer);
      
      try {
        const cartRes = await api.getCart();
        setCartCount(cartRes.data?.total_items || 0);
      } catch (e) {
        setCartCount(0);
      }
      return true;
    } catch (err) {
      console.error("Customer login failed:", err);
      return false;
    }
  };

  const customerRegister = async (data: any): Promise<boolean> => {
    try {
      const res = await api.customerRegister(data);
      const { access_token, customer: registeredCustomer } = res.data;
      localStorage.setItem('nexora_customer_token', access_token);
      setCustomerToken(access_token);
      setCustomer(registeredCustomer);
      setCartCount(0);
      return true;
    } catch (err) {
      console.error("Customer registration failed:", err);
      return false;
    }
  };

  const customerPortalRegister = async (data: { name: string; email: string; phone: string; password: string; preferred_language?: string }): Promise<boolean> => {
    try {
      const res = await api.customerPortalRegister(data);
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      localStorage.setItem('nexora_admin_token', access_token);
      setAdminToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error("Customer portal registration failed:", err);
      return false;
    }
  };

  const customerPortalLogin = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const res = await api.customerPortalLogin({ identifier, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      localStorage.setItem('nexora_admin_token', access_token);
      setAdminToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error("Customer portal login failed:", err);
      return false;
    }
  };

  const refreshCustomer = async () => {
    if (!customerToken) return;
    try {
      const res = await api.getCustomerProfile();
      setCustomer(res.data);
      const cartRes = await api.getCart();
      setCartCount(cartRes.data?.total_items || 0);
    } catch (err) {
      console.warn("Failed to refresh customer profile:", err);
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('nexora_customer_token');
    setCustomerToken(null);
    setCustomer(null);
    setCartCount(0);
  };

  const userLogin = async (data: { name: string; email: string; phone: string }): Promise<boolean> => {
    try {
      const res = await api.userLogin(data);
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      localStorage.setItem('nexora_admin_token', access_token);
      setAdminToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error("User login failed:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminToken,
        adminLogin,
        adminRegister,
        adminLogout,

        customer,
        customerToken,
        customerLogin,
        customerRegister,
        customerLogout,
        refreshCustomer,

        customerPortalLogin,
        customerPortalRegister,

        portalMode,
        setPortalMode,
        cartCount,
        setCartCount,
        loading,
        pendingHandoffsCount,
        setPendingHandoffsCount,

        token: adminToken,
        login: adminLogin,
        userLogin,
        register: adminRegister,
        forgotPassword,
        resetPassword,
        logout: adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
