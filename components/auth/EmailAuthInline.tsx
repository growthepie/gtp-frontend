'use client';

import React, { useState } from 'react';
import { GTPIcon } from '../layout/GTPIcon';
import { GTPIconName } from '@/icons/gtp-icon-names';

interface EmailAuthInlineProps {
  onSubmit?: (email: string) => void;
}

export default function EmailAuthInline({ onSubmit }: EmailAuthInlineProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSuccess(true);
      if (onSubmit) {
        onSubmit(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative transition-all duration-300">
        {/* Background overlay - matches search bar exactly */}
        <div className="absolute inset-0 bg-color-bg-default rounded-[22px] min-h-[44px]" />

        {/* Content */}
        <div className="relative flex px-[10px] gap-x-[10px] items-center min-h-[44px] rounded-[22px] z-[2]">
          {/* Icon */}
          <GTPIcon
            icon={success ? "feather:check-circle" as GTPIconName : "feather:mail" as GTPIconName}
            size="md"
            className={success ? "text-green-500" : ""}
          />

          {/* Input or Success Message */}
          {success ? (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-color-text-primary">Check your email! (check your spam/junk folder if you don't see it in your inbox)</span>
                <span className="text-xs text-color-text-secondary">Magic link sent to {email}</span>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
                className="text-xs text-color-accent-primary hover:underline ml-2"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center gap-x-[10px]">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(''); // Clear error on input
                }}
                placeholder="Enter your email to continue"
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 pl-[11px] leading-[44px]"
                disabled={isLoading}
                autoFocus
              />

              {email.length > 0 && !isLoading && (
                <button
                  type="submit"
                  className="flex items-center justify-center w-[24px] h-[24px] focus:outline-none"
                  title="Send magic link"
                >
                  <GTPIcon icon={"feather:arrow-right" as GTPIconName} size="sm" />
                </button>
              )}

              {isLoading && (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Error message below input (like form validation) */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 px-[10px]">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}