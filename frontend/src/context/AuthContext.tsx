import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  userLogin: (data: { name: string; email: string; phone: string }) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  pendingHandoffsCount: number;
  setPendingHandoffsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexora_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingHandoffsCount, setPendingHandoffsCount] = useState<number>(0);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('nexora_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          setUser(res.data);
        } catch {
          localStorage.removeItem('nexora_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login({ email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  const userLogin = async (data: { name: string; email: string; phone: string }): Promise<boolean> => {
    try {
      const res = await api.userLogin(data);
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error("User login failed:", err);
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      const res = await api.register(data);
      const { access_token, user: registeredUser } = res.data;
      localStorage.setItem('nexora_token', access_token);
      setToken(access_token);
      setUser(registeredUser);
      return true;
    } catch (err) {
      console.error("Registration failed:", err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('nexora_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        userLogin,
        register,
        logout,
        pendingHandoffsCount,
        setPendingHandoffsCount,
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

