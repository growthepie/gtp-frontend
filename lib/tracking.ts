// lib/tracking.ts

import { track as vaTrack } from '@vercel/analytics'

/**
 * Track an event to both VA & GA
 */
export function track(
  event: string,
  params: Record<string, string | number | boolean | null>
): void {
  // Send to Vercel Analytics
  vaTrack(event, params)

  // Send to GA via GTM
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void
  }
}
