import type { Metadata } from "next";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ImageOffIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Completed house design projects.",
};

/** Phase 1 placeholder — the portfolio CMS and public listing land in Phase 5 (PRD §12). */
export default function PortfolioPage() {
  return (
    <main>
      <PageHeader
        title="Portfolio"
        description="A selection of completed house designs, filterable by plot size and style."
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">
        <EmptyState
          icon={ImageOffIcon}
          title="Portfolio coming soon"
          description="We are preparing a gallery of completed projects. In the meantime, ask us for samples on WhatsApp."
        />
      </div>
    </main>
  );
}
