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