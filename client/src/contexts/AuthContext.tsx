import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    } else {
      // Fallback: decode from JWT (older sessions without stored user)
      const stored = localStorage.getItem("accessToken");
      if (stored) {
        try {
          const payload = JSON.parse(atob(stored.split(".")[1]));
          setUser({ id: payload.userId, email: payload.email, username: payload.email });
        } catch {
          api.clearTokens();
        }
      }
    }
    setLoading(false);
  }, [clearAndRedirect]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.register(email, username, password);
    api.setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem("user");
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
