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

  // gtag.js path (t.js -> gtag/js)
  // Note: gtag.js is hosted on googletagmanager.com, not google-analytics.com
  if (path === 't.js' || path.startsWith('t.js?')) {
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID || '';
    return {
      domain: 'www.googletagmanager.com',
      targetPath: ga4Id ? `gtag/js?id=${ga4Id}` : 'gtag/js',
    };
  }

  // collect path (p/ -> g/collect)
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

/**
 * Rewrite script content for proxy routing
 * - Replaces domain references with proxy host
 * - Rewrites paths
 * - Renames query params
 */
export function rewriteScriptContent(script: string, host: string): string {
  // Apply URL rewrites from config (handles wildcards)
  script = applyUrlRewrites(script)

  // Rewrite domain references (both quoted strings and full URLs)
  script = script.replace(/"www\.googletagmanager\.com"/g, `"${host}"`)
  script = script.replace(/"www\.google-analytics\.com"/g, `"${host}"`)
  script = script.replace(/https:\/\/www\.google-analytics\.com/g, `https://${host}`)
  script = script.replace(/https:\/\/www\.googletagmanager\.com/g, `https://${host}`)

  // Rewrite gtag/js paths with param renaming
  script = script.replace(/\/gtag\/js\?([^"'\s]*)/g, (match, params) => {
    const renamed = params
      .replace(/\bcx=/g, '_c=')
      .replace(/\bgtm=/g, '_g=')
      .replace(/\bid=G-/g, '_i=G-')
    return '/api/insights/t.js?' + renamed
  })
  script = script.replace(/\/gtag\/js/g, '/api/insights/t.js')

  // Rewrite collect path
  script = script.replace(/\/g\/collect/g, '/p')

  // Rewrite /a? endpoint
  script = script.replace(/["']\/a\?/g, '"/api/insights/a?')

  // Rename param literals that get concatenated at runtime
  script = script.replace(/&cx=c/g, '&_c=c')
  script = script.replace(/&cx=/g, '&_c=')
  script = script.replace(/\?cx=/g, '?_c=')
  script = script.replace(/&gtm=/g, '&_g=')
  script = script.replace(/\?gtm=/g, '?_g=')

  // Rename GA4 collect params
  script = script.replace(/\.tid=/g, '._d=')
  script = script.replace(/\.v="2"/g, '._v="2"')
  script = script.replace(/\.gtm=/g, '._g=')
  script = script.replace(/\.cid=/g, '._x=')
  script = script.replace(/\.sid=/g, '._z=')

  // Also handle the URL param patterns
  script = script.replace(/&tid=/g, '&_d=')
  script = script.replace(/\?tid=/g, '?_d=')
  script = script.replace(/&v=/g, '&_v=')
  script = script.replace(/\?v=/g, '?_v=')

  return script
}