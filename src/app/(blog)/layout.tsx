import { MarketingChrome } from "@/components/layout/marketing-chrome";

/**
 * Blog route group (plan 6). Shares the marketing chrome but has NO
 * `loading.tsx`: a loading boundary wraps the page in Suspense, and a
 * `notFound()` thrown inside a streamed Suspense boundary renders the 404 UI
 * with a 200 status (soft-404). Without the boundary, `notFound()` propagates
 * and Next sends a real 404 — which the SEO-first blog needs.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <MarketingChrome>{children}</MarketingChrome>;
}
