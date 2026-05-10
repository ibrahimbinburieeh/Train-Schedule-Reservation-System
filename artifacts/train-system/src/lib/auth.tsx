import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { User, setAuthTokenGetter } from "@workspace/api-client-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

setAuthTokenGetter(() => localStorage.getItem("token") || sessionStorage.getItem("token"));

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token") || sessionStorage.getItem("token")
  );
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }, [token]);

  const handleLogin = (newToken: string, loggedInUser: User, remember: boolean) => {
    if (remember) {
      localStorage.setItem("token", newToken);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", newToken);
      localStorage.removeItem("token");
    }
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), loggedInUser);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    queryClient.setQueryData(getGetMeQueryKey(), null);
    setLocation("/");
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
