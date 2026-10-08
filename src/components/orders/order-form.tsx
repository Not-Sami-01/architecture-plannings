"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";

import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OrderFormStepPackage } from "@/components/orders/order-form-step-package";
import { OrderFormSelectedPackage } from "@/components/orders/order-form-selected-package";
import { OrderFormStepPlot } from "@/components/orders/order-form-step-plot";
import { OrderFormStepRequirements } from "@/components/orders/order-form-step-requirements";
import { OrderFormStepBudget } from "@/components/orders/order-form-step-budget";
import { OrderFormStepUploads } from "@/components/orders/order-form-step-uploads";
import { OrderFormStepReview } from "@/components/orders/order-form-step-review";
import { OrderSubmitProgress } from "@/components/orders/order-submit-progress";
import { usePackages } from "@/hooks/packages/use-packages";
import { useSubmitOrder } from "@/hooks/orders/use-submit-order";
import { useSession } from "@/hooks/auth/use-session";
import { ApiClientError } from "@/lib/api-client/api";
import { stageFiles, type StagedFile, type StagedRejection } from "@/lib/staged-files";
import {
  orderSchema,
  type OrderFormValues,
  type OrderInput,
} from "@/lib/validators/order";

const STEPS = [
  { key: "package", title: "Package" },
  { key: "plot", title: "Plot" },
  { key: "requirements", title: "Requirements" },
  { key: "style", title: "Style & Budget" },
  { key: "uploads", title: "Files" },
  { key: "review", title: "Review" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

/** Shared form-instance type passed to step components. */
export type { OrderFormValues };
export type OrderFormInstance = UseFormReturn<OrderFormValues>;

const AUTOSAVE_KEY = "archiplan-order-draft";

type OrderFormDraft = {
  packageId?: string;
  plot?: Partial<OrderInput["plot"]>;
  requirements?: Partial<OrderInput["requirements"]>;
  style?: OrderInput["style"];
  budget?: OrderInput["budget"];
  notes?: OrderInput["notes"];
  fileIds?: string[];
};

const DEFAULTS: OrderFormValues = {
  packageId: "",
  plot: {
    width: 0,
    length: 0,
    unit: "FT",
    facing: "NORTH",
    roadSides: ["FRONT"],
    city: "",
  },
  requirements: {
    floors: 1,
    bedrooms: 3,
    bathrooms: 2,
    kitchenType: "OPEN",
    garage: false,
    lounge: false,
    extras: "",
  },
  style: "MODERN",
  budget: undefined,
  notes: "",
  fileIds: [],
};

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    number: string;
  } | null>(null);
  // Files picked in the wizard — uploaded as one gated batch on submit.
  const [staged, setStaged] = useState<StagedFile[]>([]);

  const { data: packages, loadings: packagesLoading } = usePackages();
  const { data: session } = useSession();
  const {
    data: submitData,
    loadings: submitting,
    actions: submitActions,
  } = useSubmitOrder();

  const stageFromList = (files: FileList): StagedRejection[] => {
    const result = stageFiles(staged, Array.from(files));
    setStaged(result.staged);
    return result.rejected;
  };

  const removeStagedFile = (key: string) => {
    setStaged((current) => current.filter((file) => file.key !== key));
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onTouched",
    defaultValues: DEFAULTS,
  });

  // FR-10: persist the draft locally between visits (non-sensitive values only).
  // Preselect a package when arriving via /order/new?package=slug
  // (PackageCard CTAs), and restore the autosaved draft otherwise.
  useEffect(() => {
    const slug = searchParams.get("package");
    const draft = localStorage.getItem(AUTOSAVE_KEY);
    let restored = false;
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as OrderFormDraft;
        if (parsed) {
          form.reset({ ...DEFAULTS, ...parsed });
          restored = true;
        }
      } catch {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
    if (slug && !restored) {
      const match = packages.find((pkg) => pkg.slug === slug);
      if (match) form.setValue("packageId", match.id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages.length]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      const draft: OrderFormDraft = {
        packageId: values.packageId,
        plot: values.plot,
        requirements: values.requirements,
        style: values.style,
        budget: values.budget,
        notes: values.notes,
        fileIds: values.fileIds,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const step = STEPS[stepIndex];
  const packagesForStep = useMemo(() => packages, [packages]);

  if (createdOrder) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border p-10 text-center">
        <p className="text-lg font-semibold">
          Order {createdOrder.number} submitted!
        </p>
        <p className="text-sm text-muted-foreground">
          Sign in or create an account on this browser to see it in your
          dashboard.
        </p>
        <Button
          onClick={() => {
            localStorage.removeItem(AUTOSAVE_KEY);
            router.push(session ? ROUTES.dashboard : ROUTES.register);
          }}
        >
          {session
            ? "Go to my orders"
            : "Create your account to track this order"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {STEPS.length}:{" "}
            <span className="font-medium text-foreground">{step.title}</span>
          </span>
          <span>{Math.round(((stepIndex + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((stepIndex + 1) / STEPS.length) * 100} />
      </div>

      <form
        onSubmit={form.handleSubmit(async (values) => {
          try {
            // Uploads every staged file first; POST /api/orders is only
            // called once they have all succeeded (useSubmitOrder gate).
            const order = await submitActions.submit({ values, files: staged });
            setCreatedOrder(order);
            setStaged([]);
          } catch (error) {
            if (error instanceof ApiClientError && error.status === 401) {
              // Redirected to login by the api util; draft persists locally.
              return;
            }
            // Batch failures keep the overlay open with per-file errors.
          }
        })}
      >
        {step.key !== "package" && (
          <OrderFormSelectedPackage
            form={form}
            packages={packages}
            onChange={() => setStepIndex(0)}
          />
        )}

        {step.key === "package" && (
          <OrderFormStepPackage
            form={form}
            packages={packagesForStep}
            loading={packagesLoading.loading}
          />
        )}
        {step.key === "plot" && <OrderFormStepPlot form={form} />}
        {step.key === "requirements" && (
          <OrderFormStepRequirements form={form} />
        )}
        {step.key === "style" && <OrderFormStepBudget form={form} />}
        {step.key === "uploads" && (
          <OrderFormStepUploads
            form={form}
            staged={staged}
            onStage={stageFromList}
            onRemove={removeStagedFile}
          />
        )}

        {step.key === "review" && (
          <OrderFormStepReview form={form} packages={packages} files={staged} />
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={stepIndex === 0 || submitting.busy}
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          >
            Back
          </Button>

          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={submitting.busy}
              onClick={async () => {
                const valid = await stepFieldsValid(form, step.key);
                if (valid)
                  setStepIndex((index) =>
                    Math.min(STEPS.length - 1, index + 1),
                  );
              }}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting.busy}>
              {submitting.uploading
                ? "Uploading files…"
                : submitting.submitting
                  ? "Submitting…"
                  : "Submit order"}
            </Button>
          )}
        </div>
      </form>

      <OrderSubmitProgress
        items={submitData.items}
        phase={submitData.phase}
        onRetry={() => {
          void submitActions.retry().catch(() => {
            // Errors stay in the overlay; the hooks already toasted them.
          });
        }}
        onEditFiles={() => {
          submitActions.dismiss();
          setStepIndex(STEPS.findIndex((candidate) => candidate.key === "uploads"));
        }}
      />
    </div>
  );
}

async function stepFieldsValid(
  form: OrderFormInstance,
  step: StepKey,
): Promise<boolean> {
  const fieldsByStep: Record<StepKey, Parameters<typeof form.trigger>[0]> = {
    package: ["packageId"],
    plot: ["plot"],
    requirements: ["requirements"],
    style: ["style", "budget", "notes"],
    uploads: ["fileIds"],
    review: [],
  };
  return await form.trigger(fieldsByStep[step]);
}
