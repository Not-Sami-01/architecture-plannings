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
    <ol className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.id} id={step.id} className="flex flex-col rounded-xl border bg-card p-5">
          <p className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-sm text-primary">
              {index + 1}
            </span>
            <span className="font-medium">{step.title}</span>
          </p>
          {step.provides.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground">
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
              <p className="text-xs font-medium uppercase tracking-widest text-accent-foreground">
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
