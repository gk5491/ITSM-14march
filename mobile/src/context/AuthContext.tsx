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
  const roles = (user?.role || "")
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
  const hasRole = (role: string) => roles.includes(role);

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
        isAdmin: hasRole("admin"),
        isAgent: hasRole("agent") || hasRole("admin"),
        isHR: hasRole("hr") || hasRole("admin"),
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
