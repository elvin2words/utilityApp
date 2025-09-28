import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'supervisor' | 'artisan' | null;

type AuthContextType = {
  role: Role;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(null);

  const login = async (username: string, password: string) => {
    // TODO: Replace with real API call
    if (username.startsWith('sup')) {
      setRole('supervisor');
    } else {
      setRole('artisan');
    }
  };

  const logout = () => setRole(null);

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
