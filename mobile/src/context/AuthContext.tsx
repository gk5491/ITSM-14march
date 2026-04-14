import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User } from "../api/auth";
import { setSessionCookie } from "../api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAgent: boolean;
  isHR: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const savedCookie = await AsyncStorage.getItem("session_cookie");
      if (savedCookie) {
        setSessionCookie(savedCookie);
        const me = await authApi.getMe();
        setUser(me);
      }
    } catch {
      await AsyncStorage.removeItem("session_cookie");
      setSessionCookie(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const userData = await authApi.login(username, password);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await AsyncStorage.removeItem("session_cookie");
    setSessionCookie(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isAgent: user?.role === "agent" || user?.role === "admin",
        isHR: user?.role === "hr" || user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
