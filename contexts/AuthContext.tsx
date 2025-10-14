'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setEmail(data.email || null);
      } else {
        setIsAuthenticated(false);
        setEmail(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setIsAuthenticated(false);
      setEmail(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    // Check auth on mount and path changes
    checkAuth();
  }, [pathname]);

  // Check if we're on a protected subdomain
  useEffect(() => {
    const isProtectedDomain = () => {
      if (typeof window === 'undefined') return false;

      const protectedSubdomain = process.env.NEXT_PUBLIC_PROTECTED_SUBDOMAIN;
      if (!protectedSubdomain) return false;

      const hostname = window.location.hostname;
      return hostname.includes(protectedSubdomain);
    };

    // Only enforce auth on protected subdomain
    if (isProtectedDomain() && !isLoading && !isAuthenticated) {
      // Don't redirect if we're already on auth page or verifying
      const isAuthPage = pathname === '/' || pathname.startsWith('/api/auth');
      if (!isAuthPage) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
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