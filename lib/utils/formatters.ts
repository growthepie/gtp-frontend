// Format dates in a consistent way
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateString);
  
  const formats = {
    short: { day: 'numeric', month: 'short' } as const,
    medium: { day: 'numeric', month: 'short', year: 'numeric' } as const,
    long: { day: 'numeric', month: 'long', year: 'numeric' } as const
  };
  
  return date.toLocaleDateString('en-GB', formats[format]);
}

// Format numbers with appropriate suffixes (K, M, B, etc.)
export function formatNumber(num: number, options?: { 
  decimals?: number, 
  suffix?: string, 
  prefix?: string 
}): string {
  const { decimals = 1, suffix = '', prefix = '' } = options || {};
  
  if (num === 0) return prefix + '0' + suffix;
  
  if (Math.abs(num) >= 1e9) {
    return prefix + (num / 1e9).toFixed(decimals) + 'B' + suffix;
  }
  
  if (Math.abs(num) >= 1e6) {
    return prefix + (num / 1e6).toFixed(decimals) + 'M' + suffix;
  }
  
  if (Math.abs(num) >= 1e3) {
    return prefix + (num / 1e3).toFixed(decimals) + 'K' + suffix;
  }
  
  return prefix + num.toFixed(decimals) + suffix;
}

// Compact number with fewer decimals the bigger it gets: 1.2B, 3.4M, 12K, 1.5K, 123, 12.3, 1.23.
// Used by the blockspace overview's chart and chain rows.
export function formatCompactRounded(value: number): string {
  const abs = Math.abs(value);
  if (value === 0) return "0";
  if (abs >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (abs >= 1e4 ? Math.round(value / 1e3) : (value / 1e3).toFixed(1)) + "K";
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

// Compact number with two decimals: 1.23T, 4.56B, 7.89M, 1.23K; below 1,000 with `decimals`
// (default 2). Used by the metric, landing and DA tables.
export function formatCompactTwoDecimals(value: number, decimals?: number): string {
  const abs = Math.abs(value);
  if (value === 0) return "0";
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return value.toFixed(decimals ? decimals : 2);
}

// Format a URL for display (removing protocol, trailing slashes)
export function formatUrl(url: string): string {
  if (!url) return '';
  
  return url
    .replace(/^https?:\/\//, '')  // Remove http:// or https://
    .replace(/\/$/, '');          // Remove trailing slash
}

// Format a timespan (e.g., "2 minutes ago", "yesterday")
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'yesterday';
  }
  
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  
  // For older dates, return a formatted date
  return formatDate(dateString);
}