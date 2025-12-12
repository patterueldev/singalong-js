import React, { createContext, useContext, ReactNode } from "react";

interface ApiContextType {
  apiUrl: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  // Use environment variable or default to localhost
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

  return (
    <ApiContext.Provider value={{ apiUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within ApiProvider");
  }
  return context;
}
