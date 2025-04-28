// File: lib/utils/formatters.ts
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const date = new Date(dateString);
    
    const formats = {
      short: { day: 'numeric', month: 'short' } as const,
      medium: { day: 'numeric', month: 'short', year: 'numeric' } as const,
      long: { day: 'numeric', month: 'long', year: 'numeric' } as const
    };
    
    return date.toLocaleDateString('en-GB', formats[format]);
  }