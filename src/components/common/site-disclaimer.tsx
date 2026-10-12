import { DISCLAIMER } from "@/config/constants";
import { cn } from "cn";

type SiteDisclaimerProps = {
  className?: string;
};

/** Required disclaimer on the footer and on every package and guide page. */
export function SiteDisclaimer({ className }: SiteDisclaimerProps) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      {DISCLAIMER}
    </p>
  );
}
