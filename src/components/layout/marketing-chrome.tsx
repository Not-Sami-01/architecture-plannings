import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WhatsAppButton } from "@/components/common/whatsapp-button";

/**
 * Shared chrome for public marketing sections (plan 6). Used by both the
 * `(marketing)` layout (which adds a `loading.tsx` skeleton) and the `(blog)`
 * layout (which deliberately has NO loading boundary — see below).
 */
export function MarketingChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
