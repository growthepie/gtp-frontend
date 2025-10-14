'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { storeAuthParams, isAuthenticated, getAuthEmail, clearAuthParams } from '@/lib/cloudfront-url-auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkAuth = async () => {
    setIsLoading(true);
    const authStatus = isAuthenticated();
    setIsAuthenticatedState(authStatus);
    if (authStatus) {
      setEmail(getAuthEmail());
    } else {
      setEmail(null);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    clearAuthParams();
    setIsAuthenticatedState(false);
    setEmail(null);
    router.push('/');
  };

  // Handle initial auth check from localStorage
  useEffect(() => {
    const authSuccess = searchParams.get('auth');
    
    // If we have auth params in URL, skip the initial check
    // and let the URL params handler below take care of it
    if (authSuccess === 'success') {
      return;
    }
    
    // Otherwise, check localStorage for existing auth
    checkAuth();
  }, []); // Only run once on mount

  // Handle auth params from magic link URL
  useEffect(() => {
    const authSuccess = searchParams.get('auth');
    if (authSuccess === 'success') {
      const policy = searchParams.get('cf_policy');
      const signature = searchParams.get('cf_signature');
      const keyPairId = searchParams.get('cf_keypairid');
      const expires = searchParams.get('cf_expires');
      const emailParam = searchParams.get('email');

      if (policy && signature && keyPairId && expires && emailParam) {
        // Store the params in localStorage
        storeAuthParams({
          policy,
          signature,
          keyPairId,
          expiresAt: parseInt(expires),
          email: emailParam
        });

        // Update the auth state synchronously
        setIsAuthenticatedState(true);
        setEmail(emailParam);
        setIsLoading(false);

        // Use a small delay to ensure React has processed state updates
        // before cleaning the URL
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    }
  }, [searchParams, router]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: isAuthenticatedState,
      isLoading,
      email,
      checkAuth,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}