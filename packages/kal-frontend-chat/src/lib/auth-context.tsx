"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useCallback,
} from "react";

interface AuthContextType {
  logtoId: string | null;
  email: string | null;
  name: string | null;
  setAuth: (data: {
    logtoId: string | null;
    email?: string | null;
    name?: string | null;
  }) => void;
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
  email: initialEmail,
  name: initialName,
}: {
  children: ReactNode;
  logtoId: string | null;
  email?: string | null;
  name?: string | null;
}) {
  const [auth, setInternalAuth] = useState({
    logtoId: initialLogtoId,
    email: initialEmail ?? null,
    name: initialName ?? null,
  });

  const setAuth = useCallback(
    (data: {
      logtoId: string | null;
      email?: string | null;
      name?: string | null;
    }) => {
      setInternalAuth((prev) => ({
        ...prev,
        ...data,
      }));
    },
    []
  );

  return (
    <AuthContext.Provider value={{ ...auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
