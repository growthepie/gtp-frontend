'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedAppProps {
  children: React.ReactNode;
}

export default function ProtectedApp({ children }: ProtectedAppProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isProtectedDomain, setIsProtectedDomain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protectedSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;
      if (protectedSubdomain) {
        const hostname = window.location.hostname;
        setIsProtectedDomain(hostname.includes(protectedSubdomain));
      }
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-color-bg-default flex items-center justify-center z-protected-app">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-color-accent-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-color-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If on protected domain and not authenticated, show backdrop with auth UI
  if (isProtectedDomain && !isAuthenticated) {
    return (
      <>
        {/* Backdrop covering everything */}
        <div className="fixed inset-0 bg-color-bg-default z-protected-app">
          {/* Optional: Subtle background pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
        </div>
        {/* The GlobalSearchBar will handle showing the auth UI */}
        {children}
      </>
    );
  }

  // Normal authenticated view
  return <>{children}</>;
}