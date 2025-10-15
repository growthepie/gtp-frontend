'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ShowLoading from '../layout/ShowLoading';

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

  // if this is a protected domain, prevent scrolling on the body when the auth UI is shown
  useEffect(() => {
    if (isProtectedDomain) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isProtectedDomain]);

  // Normal authenticated view
  return (
    <>
      <ShowLoading dataLoading={[isLoading]} />
      {(isProtectedDomain && !isAuthenticated) && (
        <div className="fixed inset-0 bg-color-bg-default z-protected-app">
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}