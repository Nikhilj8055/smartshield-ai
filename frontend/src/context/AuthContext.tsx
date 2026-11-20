import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  demoLogin: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartshield_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.me();
          if (res.success && res.data.user) {
            setUser(res.data.user);
          } else {
            localStorage.removeItem('smartshield_token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('smartshield_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(email, password);
      if (res.success && res.data.token) {
        localStorage.setItem('smartshield_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const demoLogin = async (): Promise<boolean> => {
    return login('demo@smartshield.ai', 'SmartShield@2026');
  };

  const logout = () => {
    localStorage.removeItem('smartshield_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
