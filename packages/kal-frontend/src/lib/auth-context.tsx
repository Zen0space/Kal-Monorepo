"use client";

import { createContext, useContext, type ReactNode, useState, useEffect, useCallback } from "react";

interface AuthContextType {
  logtoId: string | null;
  email: string | null;
  name: string | null;
  setAuth: (data: { logtoId: string | null; email?: string | null; name?: string | null }) => void;
}

const AuthContext = createContext<AuthContextType>({
  logtoId: null,
  email: null,
  name: null,
  setAuth: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({
  children,
  logtoId: initialLogtoId,
}: {
  children: ReactNode;
  logtoId: string | null;
}) {
  const [auth, setInternalAuth] = useState({
    logtoId: initialLogtoId,
    email: null as string | null,
    name: null as string | null,
  });

  const setAuth = useCallback((data: { logtoId: string | null; email?: string | null; name?: string | null }) => {
    setInternalAuth((prev) => ({
      ...prev,
      ...data,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthUpdater({ 
  logtoId,
  email,
  name
}: { 
  logtoId: string | undefined;
  email?: string | null;
  name?: string | null;
}) {
  const { setAuth } = useAuth();
  
  useEffect(() => {
    if (logtoId) {
      setAuth({ logtoId, email, name });
    }
  }, [logtoId, email, name, setAuth]);

  return null;
}
