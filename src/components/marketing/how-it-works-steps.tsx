const STEPS = [
  {
    title: "Share your requirements",
    description:
      "Fill the step-by-step form with your plot size, rooms, style, and budget. Attach reference files if you have them.",
  },
  {
    title: "Receive your quote",
    description:
      "We review your requirements and send a fixed quote with the advance payment share, usually within 24 hours.",
  },
  {
    title: "Approve and track",
    description:
      "Pay the advance to start the design. Follow every status change from your dashboard, with email updates.",
  },
  {
    title: "Review the draft",
    description:
      "Get a watermarked draft, request revisions within your package limit, then approve when you are happy.",
  },
  {
    title: "Download the finals",
    description:
      "After the final payment, download the complete drawing set — plans, elevations, and schedules.",
  },
] as const;

export function HowItWorksSteps() {
  return (
    <ol className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-3 lg:grid-cols-5">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <p className="font-medium">{step.title}</p>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
