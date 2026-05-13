// Per-route layout for /answers/[slug]. Defers metadata to page.tsx
// (which already runs generateMetadata with the answers section). Kept as a
// passthrough so middleware/segment behavior matches /quick-bites/[slug].

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
