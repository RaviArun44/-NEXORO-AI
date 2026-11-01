import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, CustomerProfile } from '../services/api';

interface AuthContextType {
  // Admin Session
  user: User | null;
  adminToken: string | null;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminRegister: (data: any) => Promise<boolean>;
  adminLogout: () => void;

  // Customer Session
  customer: CustomerProfile | null;
  customerToken: string | null;
  customerLogin: (identifier: string, password: string) => Promise<boolean>;
  customerRegister: (data: any) => Promise<boolean>;
  customerLogout: () => void;
  refreshCustomer: () => Promise<void>;

  // Portal State & Navigation
  portalMode: 'admin' | 'customer';
  setPortalMode: (mode: 'admin' | 'customer') => void;
  cartCount: number;
  setCartCount: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  pendingHandoffsCount: number;
  setPendingHandoffsCount: React.Dispatch<React.SetStateAction<number>>;

  // Backward compatible login/logout for existing views
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  userLogin: (data: { name: string; email: string; phone: string }) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('nexora_token'));
  
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem('nexora_customer_token'));
  
  const [portalMode, setPortalModeState] = useState<'admin' | 'customer'>(() => {
    // 1. Check URL parameters and hash first
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
      if (hash.includes('admin')) {
        setPortalModeState('admin');
      } else if (hash.includes('customer')) {
        setPortalModeState('customer');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshCustomer = async () => {
    const cToken = localStorage.getItem('nexora_customer_token');
    if (cToken) {
      try {
        const res = await api.customerGetMe();
        setCustomer(res.data);
      } catch {
        localStorage.removeItem('nexora_customer_token');
        setCustomerToken(null);
        setCustomer(null);
      }
    }
  };

  useEffect(() => {
    const initSessions = async () => {
      // 1. Check Admin Session
      const savedAdminToken = localStorage.getItem('nexora_token');
      if (savedAdminToken) {
        try {
          const res = await api.getMe();
          setUser(res.data);
        } catch {
          localStorage.removeItem('nexora_token');
          setAdminToken(null);
          setUser(null);
        }
      }

      // 2. Check Customer Session
      const savedCustomerToken = localStorage.getItem('nexora_customer_token');
      if (savedCustomerToken) {
        try {
          const res = await api.customerGetMe();
          setCustomer(res.data);
          
          // Fetch initial cart count
          try {
            const cartRes = await api.getCart();
            setCartCount(cartRes.data.items_count || 0);
          } catch {
            // Cart might be empty
          }
        } catch {
          localStorage.removeItem('nexora_customer_token');
          setCustomerToken(null);
          setCustomer(null);
        }
      }

      setLoading(false);
    };

    initSessions();
  }, []);

  // Admin Auth Handlers
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login({ email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      setAdminToken(access_token);
      setUser(loggedUser);
      setPortalMode('admin');
      return true;
    } catch (err) {
      console.error("Admin login failed:", err);
      return false;
    }
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

  const adminRegister = async (data: any): Promise<boolean> => {
    try {
      const res = await api.register(data);
      const { access_token, user: registeredUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      setAdminToken(access_token);
      setUser(registeredUser);
      setPortalMode('admin');
      return true;
    } catch (err) {
      console.error("Admin registration failed:", err);
      return false;
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('nexora_token');
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
      
      // Update cart count
      try {
        const cartRes = await api.getCart();
        setCartCount(cartRes.data.items_count || 0);
      } catch {}

      return true;
    } catch (err) {
      console.error("Customer login failed:", err);
      return false;
    }
  };

  const customerRegister = async (data: any): Promise<boolean> => {
    try {
      const res = await api.customerRegister(data);
      const { access_token, customer: regCustomer } = res.data;
      localStorage.setItem('nexora_customer_token', access_token);
      setCustomerToken(access_token);
      setCustomer(regCustomer);
      setCartCount(0);
      return true;
    } catch (err) {
      console.error("Customer registration failed:", err);
      return false;
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

        portalMode,
        setPortalMode,
        cartCount,
        setCartCount,
        loading,
        userLogin,
        pendingHandoffsCount,
        setPendingHandoffsCount,

        // Backwards compatibility aliases
        token: adminToken,
        login: adminLogin,
        userLogin,
        register: adminRegister,
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
