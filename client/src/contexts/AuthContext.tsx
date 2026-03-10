import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAndRedirect = useCallback(() => {
    setUser(null);
    api.clearTokens();
  }, []);

  useEffect(() => {
    api.loadStoredTokens();
    api.onAuthError(clearAndRedirect);

    // If we have a stored token, try to validate by fetching grids (lightweight)
    const stored = localStorage.getItem("accessToken");
    if (stored) {
      // Decode user from token (JWT payload)
      try {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        setUser({ id: payload.userId, email: payload.email, username: payload.email });
      } catch {
        api.clearTokens();
      }
    }
    setLoading(false);
  }, [clearAndRedirect]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.register(email, username, password);
    api.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const logout = () => {
    api.logout().catch(() => {});
    clearAndRedirect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
