import { InlineText } from "@/components/common/inline-text";

type ProcessStep = {
  id: string;
  title: string;
  provides: readonly string[];
  receives: readonly string[];
};

type ProcessStepsProps = {
  steps: readonly ProcessStep[];
};

/** Detailed process steps: what the client provides and what they receive (How It Works). */
export function ProcessSteps({ steps }: ProcessStepsProps) {
  return (
    <ol className="mx-auto grid w-full max-w-6xl gap-x-8 gap-y-10 px-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.id} id={step.id} className="border-t pt-4">
          <p className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-accent-foreground" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-display font-medium text-xl leading-snug">{step.title}</span>
          </p>
          {step.provides.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                What you provide
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {step.provides.map((item) => (
                  <li key={item} className="leading-relaxed">
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {step.receives.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                What you receive
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                {step.receives.map((item) => (
                  <li key={item} className="leading-relaxed">
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
