import {
  ClipboardListIcon,
  MessageSquareQuoteIcon,
  PenToolIcon,
  SearchCheckIcon,
  DownloadIcon,
  type LucideIcon,
} from "lucide-react";

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    icon: ClipboardListIcon,
    title: "Share your requirements",
    description:
      "Fill the step-by-step form with your plot size, rooms, style, and budget. Attach reference files if you have them.",
  },
  {
    icon: MessageSquareQuoteIcon,
    title: "Receive your quote",
    description:
      "We review your requirements and send a fixed quote with the advance payment share, usually within 24 hours.",
  },
  {
    icon: PenToolIcon,
    title: "Approve and track",
    description:
      "Pay the advance to start the design. Follow every status change from your dashboard, with email updates.",
  },
  {
    icon: SearchCheckIcon,
    title: "Review the draft",
    description:
      "Get a watermarked draft, request revisions within your package limit, then approve when you are happy.",
  },
  {
    icon: DownloadIcon,
    title: "Download the finals",
    description:
      "After the final payment, download the complete drawing set — plans, elevations, and schedules.",
  },
];

export function HowItWorksSteps() {
  return (
    <ol className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-3 lg:grid-cols-5">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <step.icon className="size-5" aria-hidden />
          </span>
          <p className="text-xs font-medium text-muted-foreground">STEP {index + 1}</p>
          <p className="font-medium">{step.title}</p>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
