import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthorityData {
  id: string;
  organization: string;
  telephone: string;
  contactName: string;
  address: string;
  needsCM2000: boolean;
}

interface AuthoritiesContextType {
  authorities: AuthorityData[];
  addAuthority: (data: AuthorityData) => void;
  updateAuthority: (data: AuthorityData) => void;
  removeAuthority: (id: string) => void;
}

const AuthoritiesContext = createContext<AuthoritiesContextType | undefined>(undefined);

export const AuthoritiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authorities, setAuthorities] = useState<AuthorityData[]>([]);

  const addAuthority = (data: AuthorityData) => {
    setAuthorities((prev) => [...prev, data]);
  };

  const updateAuthority = (data: AuthorityData) => {
    setAuthorities((prev) => prev.map((a) => (a.id === data.id ? data : a)));
  };

  const removeAuthority = (id: string) => {
    setAuthorities((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AuthoritiesContext.Provider value={{ authorities, addAuthority, updateAuthority, removeAuthority }}>
      {children}
    </AuthoritiesContext.Provider>
  );
};

export const useAuthorities = (): AuthoritiesContextType => {
  const context = useContext(AuthoritiesContext);
  if (!context) {
    throw new Error('useAuthorities must be used within an AuthoritiesProvider');
  }
  return context;
};
