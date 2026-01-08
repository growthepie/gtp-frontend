// app/api/insights/p/route.ts
// Re-export from ga/p - both routes handle GA4 collect
export { GET, POST, OPTIONS } from '../ga/p/route'

// runtime must be declared directly, not re-exported (Next.js 16 requirement)
export const runtime = 'edge'
