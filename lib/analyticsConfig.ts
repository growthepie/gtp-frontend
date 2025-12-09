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

  // Domain mappings for proxy routing
  // Supports wildcards: *.domain.com will match any subdomain
  domainMappings: [
    { pattern: '*.clarity.ms', proxyPrefix: 'cl' },
    { pattern: 'www.googletagmanager.com', proxyPrefix: '' },
    { pattern: 'www.google-analytics.com', proxyPrefix: 'ga' },
  ],

  // URL rewrites for script content (static replacements)
  urlRewrites: [
    // Google Tag Manager
    { from: 'https://www.googletagmanager.com/', to: '/api/insights/' },
    // Google Analytics
    { from: 'https://www.google-analytics.com/', to: '/api/insights/ga/' },
    // Clarity - wildcard pattern handled by regex in proxy
    { from: /https:\/\/([a-z]+)\.clarity\.ms\//g, to: '/api/insights/cl/$1/' },
  ],
} as const;

// Helper to apply URL rewrites (handles both string and regex patterns)
export function applyUrlRewrites(content: string): string {
  ANALYTICS_CONFIG.urlRewrites.forEach((rewrite) => {
    if (typeof rewrite.from === 'string') {
      const escapedFrom = rewrite.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(escapedFrom, 'g'), rewrite.to as string);
    } else {
      content = content.replace(rewrite.from, rewrite.to as string);
    }
  });
  return content;
}

// Helper to resolve domain from proxy path
export function resolveProxyDomain(path: string): { domain: string; targetPath: string } {
  // Check for Clarity wildcard pattern: cl/{subdomain}/...
  const clarityMatch = path.match(/^cl\/([a-z]+)\/(.*)/);
  if (clarityMatch) {
    return {
      domain: `${clarityMatch[1]}.clarity.ms`,
      targetPath: clarityMatch[2],
    };
  }

  // Legacy Clarity prefixes (for backwards compatibility)
  if (path.startsWith('c/')) {
    return {
      domain: 'www.clarity.ms',
      targetPath: 'tag/' + path.substring(2),
    };
  }
  if (path.startsWith('cs/')) {
    return {
      domain: 'scripts.clarity.ms',
      targetPath: path.substring(3),
    };
  }
  if (path.startsWith('ca/')) {
    return {
      domain: 'a.clarity.ms',
      targetPath: path.substring(3),
    };
  }
  if (path.startsWith('ck/')) {
    return {
      domain: 'k.clarity.ms',
      targetPath: path.substring(3),
    };
  }
  if (path.startsWith('cj/')) {
    return {
      domain: 'j.clarity.ms',
      targetPath: path.substring(3),
    };
  }

  // Check for GA prefix
  if (path.startsWith('ga/')) {
    return {
      domain: 'www.google-analytics.com',
      targetPath: path.substring(3),
    };
  }

  // Obfuscated gtag.js path (t.js -> gtag/js)
  // Note: gtag.js is hosted on googletagmanager.com, not google-analytics.com
  if (path === 't.js' || path.startsWith('t.js?')) {
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || '';
    return {
      domain: 'www.googletagmanager.com',
      targetPath: ga4Id ? `gtag/js?id=${ga4Id}` : 'gtag/js',
    };
  }

  // Obfuscated collect path (p/ -> g/collect)
  if (path.startsWith('p/') || path === 'p') {
    return {
      domain: 'www.google-analytics.com',
      targetPath: 'g/collect' + (path.length > 2 ? path.substring(1) : ''),
    };
  }

  // Default to GTM
  return {
    domain: 'www.googletagmanager.com',
    targetPath: path,
  };
}

export const getConsentUpdate = (granted: boolean) => {
  if (granted) {
    return ANALYTICS_CONFIG.consentTypes;
  }
  return ANALYTICS_CONFIG.defaultConsent;
};