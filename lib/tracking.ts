// lib/tracking.ts

import { track as vaTrack } from '@vercel/analytics'

/**
 * Check if user has granted cookie consent
 */
function hasGrantedConsent(): boolean {
  if (typeof document === 'undefined') return false
  const cookie = document.cookie.split('; ').find(row => row.startsWith('gtpCookieConsent='))
  return cookie ? cookie.split('=')[1] === 'true' : false
}

/**
 * Track an event to both VA & GA
 */
export function track(
  event: string,
  params: Record<string, string | number | boolean | null>
): void {
  // Send to Vercel Analytics
  vaTrack(event, params)

  // Send to GA via GTM only if user has granted consent
  if (typeof window !== 'undefined' && window.gtag && hasGrantedConsent()) {
    window.gtag('event', event, params)
  }
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void
  }
}
