import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "singalong-shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Load stored session on app start
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("sessionToken");
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setSessionToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to load stored session:", error);
    }
  };

  const login = async (newUser: User, token: string) => {
    setUser(newUser);
    setSessionToken(token);
    
    try {
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      await AsyncStorage.setItem("sessionToken", token);
    } catch (error) {
      console.error("Failed to store session:", error);
    }
  };

  const logout = async () => {
    setUser(null);
    setSessionToken(null);
    
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("sessionToken");
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        login,
        logout,
        isAuthenticated: !!user && !!sessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
