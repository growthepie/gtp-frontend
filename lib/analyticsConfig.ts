export const ANALYTICS_CONFIG = {
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',
  proxyPaths: {
    gtm: '/api/insights/data.js',
    clarity: '/api/insights/c/',
    analytics: '/api/insights/',
  },
  
  // Consent types required by Google
  consentTypes: {
    ad_storage: 'granted',
    ad_personalization: 'granted',
    ad_user_data: 'granted',
    analytics_storage: 'granted',
  } as const,
  
  // Default consent state (before user accepts)
  defaultConsent: {
    ad_storage: 'denied',
    ad_personalization: 'denied',
    ad_user_data: 'denied',
    analytics_storage: 'denied',
  } as const,
  
  urlRewrites: [
    { from: 'https://www.googletagmanager.com/', to: '/api/insights/' },
    { from: 'https://www.google-analytics.com/', to: '/api/insights/' },
    { from: 'https://www.clarity.ms/', to: '/api/insights/c/' },
    { from: 'https://clarity.ms/', to: '/api/insights/c/' },
  ],
} as const;

export const getConsentUpdate = (granted: boolean) => {
  if (granted) {
    return ANALYTICS_CONFIG.consentTypes;
  }
  return ANALYTICS_CONFIG.defaultConsent;
};